import { PrismaClient } from "@prisma/client";
import { sendWhatsAppMessage } from "../services/whatsappService";

const prisma = new PrismaClient();

/**
 * Synchronizes the parent Order status and TempleLedger entries based on a SubOrder's status change.
 * This is used for both manual admin updates and automatic Shiprocket webhook updates.
 */
export const syncOrderAndLedgerStatus = async (subOrderId: string, status: string) => {
    // 1. Update the SubOrder status
    const subOrder = await prisma.subOrder.update({
        where: { id: subOrderId },
        data: {
            status: status.toUpperCase(),
            updatedAt: new Date()
        },
        include: {
            order: {
                include: {
                    user: true
                }
            }
        }
    });

    // Notify Devotee via WhatsApp for Dispatch
    if (status.toUpperCase() === "SHIPPED") {
        try {
            const user = subOrder.order.user;
            if (user && user.phone) {
                const phone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;
                await sendWhatsAppMessage(
                    phone,
                    user.name || 'Bhakt',
                    "prasad_dispatched",
                    [
                        user.name || 'Bhakt',
                        subOrderId, // Or a more human readable name if available
                        subOrder.awbCode || 'N/A'
                    ]
                );
            }
        } catch (waError) {
            console.error("Failed to send dispatch WhatsApp:", waError);
        }
    }

    // 2. Sync Ledger Status (Earnings for Temple/Seller)
    if (status.toUpperCase() === "DELIVERED") {
        await prisma.templeLedger.updateMany({
            where: { sourceId: subOrderId, type: "MARKETPLACE_EARNING" },
            data: { status: "COMPLETED" }
        });
    } else if (status.toUpperCase() === "CANCELLED" || status.toUpperCase() === "RTO_DELIVERED") {
        await prisma.templeLedger.updateMany({
            where: { sourceId: subOrderId, type: "MARKETPLACE_EARNING" },
            data: { status: "CANCELLED" }
        });
    }

    // 3. Sync Parent Order Status
    const parentOrder = await prisma.order.findUnique({
        where: { id: subOrder.orderId },
        include: { subOrders: true }
    });

    if (parentOrder) {
        const subStatuses = parentOrder.subOrders.map(so => so.status.toUpperCase());

        let newParentStatus = "PENDING";

        if (subStatuses.every(s => s === "DELIVERED")) {
            newParentStatus = "COMPLETED";
        } else if (subStatuses.every(s => s === "CANCELLED")) {
            newParentStatus = "CANCELLED";
        } else if (subStatuses.some(s => ["SHIPPED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s))) {
            // If any part of the order is moving or delivered (but not all delivered), it's partially shipped or in progress
            const anyDelivered = subStatuses.some(s => s === "DELIVERED");
            const anyShipping = subStatuses.some(s => ["SHIPPED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(s));

            if (anyDelivered || anyShipping) {
                newParentStatus = "PARTIALLY_SHIPPED";
            }
        } else if (subStatuses.some(s => s === "ACCEPTED")) {
            newParentStatus = "PROCESSING";
        }

        await prisma.order.update({
            where: { id: parentOrder.id },
            data: { status: newParentStatus }
        });
    }

    return subOrder;
};

/**
 * Maps granular Shiprocket statuses to internal system statuses.
 */
export const mapShiprocketStatus = (srStatus: string): string => {
    const status = srStatus.toLowerCase().trim();

    const mapping: { [key: string]: string } = {
        'pickup scheduled': 'ACCEPTED',
        'pickup generated': 'ACCEPTED',
        'pickup queued': 'ACCEPTED',
        'pickup error': 'PICKUP_ERROR',
        'picked up': 'PICKED_UP',
        'in transit': 'SHIPPED',
        'out for delivery': 'OUT_FOR_DELIVERY',
        'delivered': 'DELIVERED',
        'cancelled': 'CANCELLED',
        'rto initiated': 'RTO_INITIATED',
        'rto delivered': 'RTO_DELIVERED',
        'rto acknowledged': 'RTO_INITIATED',
        'lost': 'LOST',
        'damaged': 'DAMAGED'
    };

    return mapping[status] || status.toUpperCase();
};
