import { Router, Request, Response } from "express";
import { buyerOnlyRoute } from "../../../middleware/auths";
import { prisma } from "../../../utils/prisma";

const router = Router();

/**
 * GET /api/buyer/dashboard - Get buyer's dashboard overview data
 */
router.get("/", buyerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const buyerId = req.user!.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── All core counts in one round-trip ────────────────────────────────────
    const [
      totalOrders,
      pendingOrders,      // orders buyer is still waiting on (PENDING or CONFIRMED)
      deliveredOrders,
      totalSpentAgg,
      favoriteCount,
      recentOrders,
      monthlyOrders,
    ] = await Promise.all([

      prisma.order.count({ where: { buyerId } }),

      // PENDING + CONFIRMED = "awaiting delivery"
      prisma.order.count({
        where: {
          buyerId,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),

      prisma.order.count({ where: { buyerId, status: "DELIVERED" } }),

      prisma.order.aggregate({
        where: { buyerId },
        _sum: { totalAmount: true },
      }),

      prisma.favorite.count({ where: { buyerId } }),

      // Recent orders (last 10), newest first
      prisma.order.findMany({
        where: { buyerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          items: {
            include: {
              produce: {
                select: {
                  name: true,
                  images: true,
                  farmer: { select: { name: true, location: true } },
                },
              },
            },
          },
        },
      }),

      // Orders in the last 30 days for monthly activity
      prisma.order.findMany({
        where: { buyerId, createdAt: { gte: thirtyDaysAgo } },
        include: {
          items: {
            include: {
              produce: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const totalSpent = totalSpentAgg._sum.totalAmount ?? 0;

    // ── Recommended products ─────────────────────────────────────────────────
    // Latest AVAILABLE produce not from this user
    const recommendedProducts = await prisma.produce.findMany({
      where: {
        status: "AVAILABLE",
        NOT: { farmerId: buyerId },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        farmer: { select: { name: true, location: true } },
        category: { select: { name: true } },
      },
    });

    // Compute average ratings efficiently with one groupBy query
    const productIds = recommendedProducts.map((p) => p.id);
    const ratingsGrouped = await prisma.review.groupBy({
      by: ["targetId"],
      where: { targetId: { in: productIds }, reviewType: "product" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const ratingsMap = new Map(
      ratingsGrouped.map((r) => [r.targetId, { avg: r._avg.rating ?? 0, count: r._count.rating }])
    );

    const productsWithStats = recommendedProducts.map((p) => {
      const ratingInfo = ratingsMap.get(p.id) ?? { avg: 0, count: 0 };
      return { ...p, averageRating: ratingInfo.avg, reviewCount: ratingInfo.count };
    });

    // ── Top categories the buyer has purchased ───────────────────────────────
    const buyerOrderIds = (await prisma.order.findMany({
      where: { buyerId },
      select: { id: true },
    })).map((o) => o.id);

    let topCategories: { categoryName: string; purchaseCount: number }[] = [];
    if (buyerOrderIds.length > 0) {
      const grouped = await prisma.orderItem.groupBy({
        by: ["produceId"],
        where: { orderId: { in: buyerOrderIds } },
        _count: { produceId: true },
        orderBy: { _count: { produceId: "desc" } },
        take: 5,
      });

      topCategories = await Promise.all(
        grouped.map(async (item) => {
          const produce = await prisma.produce.findUnique({
            where: { id: item.produceId },
            include: { category: { select: { name: true } } },
          });
          return {
            categoryName: produce?.category?.name ?? "Unknown",
            purchaseCount: item._count.produceId,
          };
        })
      );
    }

    // ── Monthly activity summary ─────────────────────────────────────────────
    const monthlyTotalSpent = monthlyOrders.reduce(
      (sum, order) => sum + (order.totalAmount ?? 0),
      0
    );
    const uniqueProducts = new Set(
      monthlyOrders.flatMap((order) =>
        order.items
          .filter((item) => item.produce?.name)
          .map((item) => item.produce!.name)
      )
    ).size;

    // ── Build response ───────────────────────────────────────────────────────
    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalSpent,
          favoriteCount,
        },

        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            productName: item.produce?.name ?? "Produce",
            quantity: item.quantity,
            price: item.price,
            farmerName: item.produce?.farmer?.name ?? "Unknown",
            farmerLocation: item.produce?.farmer?.location ?? "N/A",
            images: item.produce?.images ?? [],
          })),
        })),

        recommendedProducts: productsWithStats,
        topCategories,

        monthlyActivity: {
          totalOrders: monthlyOrders.length,
          totalSpent: monthlyTotalSpent,
          uniqueProducts,
        },
      },
    });

  } catch (error) {
    console.error("Error fetching buyer dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
});

export default router;