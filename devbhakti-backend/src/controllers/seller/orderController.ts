import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { notifyUser } from "../../services/firebaseService";
import { syncOrderAndLedgerStatus } from "../../utils/orderStatusSync";

// Get orders specifically for a Seller (Store)
export const getSellerOrders = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).owner.ownerId;

        const subOrders = await prisma.subOrder.findMany({
            where: { sellerId },
            include: {
                order: {
                    include: {
                        user: { select: { name: true, phone: true } }
                    }
                },
                items: {
                    include: {
                        product: { select: { name: true, image: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ success: true, data: subOrders });
    } catch (error: any) {
        console.error("Seller Orders Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Seller updates their own sub-order status
export const updateSellerOrderStatus = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).owner.ownerId;
        const subOrderId = req.params.subOrderId as string;
        const { status, shippingLabel } = req.body;

        // Verify this sub-order belongs to the store
        const existing = await prisma.subOrder.findUnique({
            where: { id: subOrderId }
        });

        if (!existing || existing.sellerId !== sellerId) {
            return res.status(403).json({ success: false, message: "Unauthorized or order not found" });
        }

        // Optional: Update shippingLabel if provided
        if (shippingLabel) {
            await prisma.subOrder.update({
                where: { id: subOrderId },
                data: { shippingLabel }
            });
        }

        // Use shared utility for status sync (Ledger, Parent Order, etc.)
        const updated = await syncOrderAndLedgerStatus(subOrderId, status);

        // Fetch parent order for notification
        const parentOrder = await prisma.order.findUnique({
            where: { id: updated.orderId }
        });

        // Notify devotee
        if (parentOrder) {
            await notifyUser(parentOrder.userId || 'unknown', 'devotee', {
                title: `Order Status Updated: ${status}`,
                body: `Your order from your favorite seller has been marked as ${status.toLowerCase()}.`,
                data: { link: `/profile/orders/${parentOrder.id}`, orderId: parentOrder.id }
            });
        }

        return res.status(200).json({ success: true, message: "Order status updated", data: updated });
    } catch (error: any) {
        console.error("Update Seller Order Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
// Get unique customers for a Seller
export const getSellerCustomers = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).owner.ownerId;

        // Find all sub-orders for this seller
        const subOrders = await prisma.subOrder.findMany({
            where: { sellerId },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Extract unique customers and their order summary
        const customerMap = new Map();

        subOrders.forEach(so => {
            const customer = so.order.user;
            if (customer) {
                if (!customerMap.has(customer.id)) {
                    customerMap.set(customer.id, {
                        ...customer,
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrderDate: so.createdAt
                    });
                }

                const stats = customerMap.get(customer.id);
                stats.totalOrders += 1;
                stats.totalSpent += so.totalAmount;
                if (new Date(so.createdAt) > new Date(stats.lastOrderDate)) {
                    stats.lastOrderDate = so.createdAt;
                }
            }
        });

        const customers = Array.from(customerMap.values());

        return res.status(200).json({ success: true, data: customers });
    } catch (error: any) {
        console.error("Seller Customers Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
