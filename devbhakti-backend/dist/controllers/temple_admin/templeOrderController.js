"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTempleOrderStatus = exports.getTempleOrders = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get orders specifically for a Temple
const getTempleOrders = async (req, res) => {
    try {
        const templeId = req.params.templeId;
        const subOrders = await prisma.subOrder.findMany({
            where: { templeId },
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTempleOrders = getTempleOrders;
// Temple updates their own sub-order status
const updateTempleOrderStatus = async (req, res) => {
    try {
        const subOrderId = req.params.subOrderId;
        const { status, shippingLabel, templeId } = req.body;
        // Verify this sub-order belongs to the temple
        const existing = await prisma.subOrder.findUnique({
            where: { id: subOrderId }
        });
        if (!existing || existing.templeId !== templeId) {
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
        }
        else if (status === "CANCELLED") {
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
            }
            else {
                const anyShipped = parentOrder.subOrders.some(so => so.status === "SHIPPED");
                if (anyShipped) {
                    await prisma.order.update({
                        where: { id: parentOrder.id },
                        data: { status: "PARTIALLY_SHIPPED" }
                    });
                }
            }
        }
        return res.status(200).json({ success: true, message: "Order status updated", data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateTempleOrderStatus = updateTempleOrderStatus;
