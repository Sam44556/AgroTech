import { Router, Request, Response } from "express";
import { buyerOnlyRoute } from "../../../middleware/auths";
import { prisma } from "../../../utils/prisma";

const router = Router();

/**
 * POST /api/buyer/orders - Create a new order (buyer places bids)
 * Body: { items: [{ produceId, quantity, price }] }
 */
router.post("/", buyerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const buyerId = req.user!.id;
    const { items } = req.body as any;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }

    // Validate produces and compute total
    const produceIds = items.map((i: any) => i.produceId);
    const produces = await prisma.produce.findMany({ where: { id: { in: produceIds } } });
    const produceMap: Record<string, any> = {};
    produces.forEach(p => { produceMap[p.id] = p });

    let total = 0;
    for (const it of items) {
      const p = produceMap[it.produceId];
      if (!p) return res.status(400).json({ success: false, message: `Produce ${it.produceId} not found` });
      if (!it.quantity || it.quantity <= 0) return res.status(400).json({ success: false, message: `Invalid quantity for ${it.produceId}` });
      if (!it.price || it.price <= 0) return res.status(400).json({ success: false, message: `Invalid price for ${it.produceId}` });
      total += Number(it.price) * Number(it.quantity);
    }

    // Create order
    const order = await prisma.order.create({ data: { buyerId, totalAmount: total } });

    // Create order items
    const createdItems = [];
    for (const it of items) {
      const created = await prisma.orderItem.create({ data: {
        orderId: order.id,
        produceId: it.produceId,
        quantity: Number(it.quantity),
        price: Number(it.price)
      }});
      createdItems.push(created);
    }

    res.json({ success: true, message: 'Order created', data: { order, items: createdItems } });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

/**
 * GET /api/buyer/orders - List buyer orders
 */
router.get("/", buyerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const buyerId = req.user!.id;
    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: { items: { include: { produce: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

export default router;
