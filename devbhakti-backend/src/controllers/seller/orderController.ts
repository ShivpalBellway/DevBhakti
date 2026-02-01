import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

// Get orders specifically for a Seller (Store)
export const getSellerOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Find the store (SellerProfile) associated with this user
        const store = await prisma.sellerProfile.findUnique({
            where: { userId }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        const subOrders = await prisma.subOrder.findMany({
            where: { sellerId: store.id },
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
        const userId = (req as any).user.userId;
        const subOrderId = req.params.subOrderId as string;
        const { status, shippingLabel } = req.body;

        const store = await prisma.sellerProfile.findUnique({
            where: { userId }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        // Verify this sub-order belongs to the store
        const existing = await prisma.subOrder.findUnique({
            where: { id: subOrderId }
        });

        if (!existing || existing.sellerId !== store.id) {
            return res.status(403).json({ success: false, message: "Unauthorized or order not found" });
        }

        const updated = await prisma.subOrder.update({
            where: { id: subOrderId },
            data: { status, shippingLabel, updatedAt: new Date() }
        });

        // Sync Ledger Status
        if (status === "DELIVERED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: subOrderId, type: "MARKETPLACE_EARNING" },
                data: { status: "COMPLETED" }
            });
        } else if (status === "CANCELLED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: subOrderId, type: "MARKETPLACE_EARNING" },
                data: { status: "CANCELLED" }
            });
        }

        // Check if all sub-orders of the parent order are delivered/completed
        const parentOrder = await prisma.order.findUnique({
            where: { id: updated.orderId },
            include: { subOrders: true }
        });

        if (parentOrder) {
            const allDone = parentOrder.subOrders.every(so => so.status === "DELIVERED");
            if (allDone) {
                await prisma.order.update({
                    where: { id: parentOrder.id },
                    data: { status: "COMPLETED" }
                });
            } else {
                const anyShipped = parentOrder.subOrders.some(so => so.status === "SHIPPED");
                const anyAccepted = parentOrder.subOrders.some(so => so.status === "ACCEPTED");

                let newOrderStatus = parentOrder.status;
                if (anyShipped) {
                    newOrderStatus = "PARTIALLY_SHIPPED";
                } else if (anyAccepted) {
                    newOrderStatus = "PROCESSING";
                }

                if (newOrderStatus !== parentOrder.status) {
                    await prisma.order.update({
                        where: { id: parentOrder.id },
                        data: { status: newOrderStatus }
                    });
                }
            }
        }

        return res.status(200).json({ success: true, message: "Order status updated", data: updated });
    } catch (error: any) {
        console.error("Update Seller Order Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
