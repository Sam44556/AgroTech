import { Router, Request, Response } from "express";
import { farmerOnlyRoute } from "../../../middleware/auths";
import { prisma } from "../../../utils/prisma";

const router = Router();

/**
 * GET /api/farmer/orders - List order items that reference this farmer's produce
 */
router.get("/", farmerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const farmerId = req.user!.id;

    const items = await prisma.orderItem.findMany({
      where: {
        produce: { farmerId }
      },
      include: {
        produce: true,
        order: { include: { buyer: { include: { buyerProfile: true } } } }
      },
      orderBy: { id: 'desc' }
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch farmer orders' });
  }
});

/**
 * PUT /api/farmer/orders/:itemId/approve - Approve an order item (bid)
 */
router.put("/:itemId/approve", farmerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const farmerId = req.user!.id;
    const { itemId } = req.params;

    const item = await prisma.orderItem.findUnique({ where: { id: itemId }, include: { produce: true, order: true } });
    if (!item) return res.status(404).json({ success: false, message: 'Order item not found' });
    if (item.produce.farmerId !== farmerId) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (item.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Item already processed' });

    // Check quantity
    if (item.produce.quantity < item.quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient produce quantity' });
    }

    // Decrement produce quantity
    const newQty = Number(item.produce.quantity) - Number(item.quantity);
    await prisma.produce.update({ where: { id: item.produce.id }, data: { quantity: newQty, status: newQty <= 0 ? 'SOLD_OUT' : item.produce.status } });

    // Update order item
    const updatedItem = await prisma.orderItem.update({ where: { id: itemId }, data: { status: 'APPROVED', approvedBy: farmerId, approvedAt: new Date() } });

    res.json({ success: true, data: updatedItem, message: 'Order item approved' });
  } catch (error) {
    console.error('Error approving order item:', error);
    res.status(500).json({ success: false, message: 'Failed to approve order item' });
  }
});

export default router;
