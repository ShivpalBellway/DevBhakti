import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const shiprocketWebhook = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        console.log("Shiprocket Webhook Received:", JSON.stringify(data));

        const {
            order_id,
            status,
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
                await prisma.subOrder.update({
                    where: { id: subOrder.id },
                    data: {
                        status: status.toUpperCase(),
                        awbCode: awb || subOrder.awbCode,
                        trackingUrl: tracking_url || subOrder.trackingUrl,
                        courierName: courier_name || subOrder.courierName
                    }
                });
                console.log(`Updated SubOrder ${subOrder.id} status to ${status}`);
            }
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("Shiprocket Webhook Error:", error.message);
        return res.status(500).json({ success: false });
    }
};
