import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { syncOrderAndLedgerStatus, mapShiprocketStatus } from "../utils/orderStatusSync";

const prisma = new PrismaClient();

export const shiprocketWebhook = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log("Shiprocket Webhook Received:", JSON.stringify(data));

        const {
            order_id,
            status: srStatus,
            awb,
            tracking_url,
            courier_name
        } = data;

        if (order_id) {
            // Find sub-order by shiprocketOrderId
            const subOrder = await prisma.subOrder.findFirst({
                where: { shiprocketOrderId: order_id.toString() }
            });

            if (subOrder) {
                const internalStatus = mapShiprocketStatus(srStatus);

                // Update common tracking fields
                await prisma.subOrder.update({
                    where: { id: subOrder.id },
                    data: {
                        awbCode: awb || subOrder.awbCode,
                        trackingUrl: tracking_url || subOrder.trackingUrl,
                        courierName: courier_name || subOrder.courierName
                    }
                });

                // Use shared utility for status sync (Ledger, Parent Order, etc.)
                await syncOrderAndLedgerStatus(subOrder.id, internalStatus);

                console.log(`Updated SubOrder ${subOrder.id} status to ${internalStatus} (from SR: ${srStatus})`);

                if (internalStatus === "SHIPPED" || internalStatus === "DELIVERED") {
                    try {
                        const { notifyUser } = require("../services/firebaseService");
                        const parentOrder = await prisma.order.findUnique({ where: { id: subOrder.orderId } });
                        if (parentOrder) {
                            await notifyUser(parentOrder.userId, 'devotee', {
                                title: `Order ${internalStatus}! 📦`,
                                body: `Your order update: sub-order is now ${internalStatus}. ${tracking_url ? `Track it here: ${tracking_url}` : ''}`,
                                data: {
                                    link: `/profile/orders`,
                                    type: `ORDER_${internalStatus}`,
                                    orderId: parentOrder.id
                                }
                            });
                        }
                    } catch (notifyErr) {
                        console.error("Failed to send order status push notification:", notifyErr);
                    }
                }
            } else {
                // Find PoojaBooking by shiprocketOrderId
                const booking = await prisma.poojaBooking.findFirst({
                    where: { shiprocketOrderId: order_id.toString() },
                    include: { pooja: true }
                });

                if (booking) {
                    const internalStatus = mapShiprocketStatus(srStatus);
                    let prasadStatus: 'PREPARING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' = 'PREPARING';

                    if (internalStatus === 'ACCEPTED' || internalStatus === 'PICKED_UP') {
                        prasadStatus = 'DISPATCHED';
                    } else if (internalStatus === 'SHIPPED' || internalStatus === 'OUT_FOR_DELIVERY') {
                        prasadStatus = 'IN_TRANSIT';
                    } else if (internalStatus === 'DELIVERED') {
                        prasadStatus = 'DELIVERED';
                    }

                    // Update PoojaBooking fields
                    await prisma.poojaBooking.update({
                        where: { id: booking.id },
                        data: {
                            awbCode: awb || booking.awbCode,
                            trackingUrl: tracking_url || booking.trackingUrl,
                            courierName: courier_name || booking.courierName,
                            prasadStatus
                        }
                    });

                    console.log(`Updated PoojaBooking ${booking.id} prasadStatus to ${prasadStatus} (from SR: ${srStatus})`);

                    // Notify user about Prasad status update
                    try {
                        const { notifyUser } = require("../services/firebaseService");
                        const { getEnglish } = require("../utils/localization");
                        
                        let title = "";
                        let body = "";

                        if (prasadStatus === 'DISPATCHED') {
                            title = "Prasad Dispatched! 📦";
                            body = `Your Prasad for ${getEnglish(booking.pooja.name)} has been dispatched via ${courier_name || 'courier'}. Tracking ID: ${awb || ''}`;
                        } else if (prasadStatus === 'IN_TRANSIT') {
                            title = "Prasad In Transit 🚚";
                            body = `Your Prasad for ${getEnglish(booking.pooja.name)} is on the way!`;
                        } else if (prasadStatus === 'DELIVERED') {
                            title = "Prasad Delivered! 🎁";
                            body = `Your Prasad for ${getEnglish(booking.pooja.name)} has been successfully delivered. Jai Mata Di!`;
                        }

                        const userId = booking.userId ?? undefined;
                        if (title && userId) {
                            await notifyUser(userId, 'devotee', {
                                title,
                                body,
                                data: {
                                    link: `/profile/bookings`,
                                    bookingId: booking.id
                                }
                            });
                        }
                    } catch (notifyErr) {
                        console.error("Failed to send prasad status push notification:", notifyErr);
                    }
                }
            }
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("Shiprocket Webhook Error:", error.message);
        return res.status(500).json({ success: false });
    }
};
