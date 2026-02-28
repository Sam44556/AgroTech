import { Router, Request, Response } from "express";
import { farmerOnlyRoute } from "../../../middleware/auths";
import { prisma } from "../../../utils/prisma";

const router = Router();

/**
 * GET /api/farmer/dashboard - Get farmer's dashboard overview data
 *
 * Returns:
 *  - stats.activeListings      : # of farmer's produce with status AVAILABLE
 *  - stats.soldCrops           : # of order items belonging to farmer that are APPROVED
 *  - stats.totalConversations  : # of conversations the farmer participates in
 *  - stats.totalRevenue        : sum of (price × quantity) for all APPROVED order items of farmer
 */
router.get("/", farmerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const farmerId = req.user!.id;

    // ── 1. Farmer basic info ────────────────────────────────────────────────
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      select: {
        name: true,
        location: true,
      },
    });

    // ── 2. Box 1: Active listings (status = AVAILABLE) ──────────────────────
    const activeListings = await prisma.produce.count({
      where: {
        farmerId,
        status: "AVAILABLE",
      },
    });

    // ── 3. Box 2 & 4: Approved order items for farmer's produce ─────────────
    //    OrderItem.status = APPROVED means the farmer approved the sale
    const approvedOrderItems = await prisma.orderItem.findMany({
      where: {
        status: "APPROVED",
        produce: {
          farmerId,
        },
      },
      select: {
        quantity: true,
        price: true,
      },
    });

    // Box 2 – number of crops sold (count of approved order items)
    const soldCrops = approvedOrderItems.length;

    // Box 4 – total revenue: Σ (price × quantity) for all approved order items
    const totalRevenue = approvedOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // ── 4. Box 3: Total conversations the farmer is part of ─────────────────
    const totalConversations = await prisma.conversationParticipant.count({
      where: {
        userId: farmerId,
      },
    });

    // ── 5. Recent listings (for the table below the stat cards) ────────────
    const recentListings = await prisma.produce.findMany({
      where: { farmerId },
      select: {
        id: true,
        name: true,
        price: true,
        quantity: true,
        status: true,
        images: true,
        createdAt: true,
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // ── 6. Recent orders for farmer's produce ──────────────────────────────
    const recentOrders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            produce: { farmerId },
          },
        },
      },
      include: {
        items: {
          where: {
            produce: { farmerId },
          },
          include: {
            produce: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        farmer: {
          name: farmer?.name,
          location: farmer?.location,
        },
        stats: {
          activeListings,
          soldCrops,
          totalConversations,
          totalRevenue,
        },
        recentListings: recentListings.map((l: any) => ({
          id: l.id,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
          status: l.status,
          images: l.images,
          totalValue: l.price * l.quantity,
          createdAt: l.createdAt,
          ordersCount: l._count.orderItems,
        })),
        recentOrders: recentOrders.map((order: any) => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          itemsCount: order.items.length,
          items: order.items.map((item: any) => item.produce.name),
          createdAt: order.createdAt,
        })),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data",
      message: "Could not retrieve farmer dashboard information",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;