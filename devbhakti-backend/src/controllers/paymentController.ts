import { Request, Response } from "express";
import crypto from "crypto";
import { PrismaClient, SlabType, CommissionCategory } from "@prisma/client";
import razorpay from "../lib/razorpay";
import { createVerifiedOrder } from "./marketplace/productOrderController";
import { getCommissionForAmount } from "./admin/commissionSlabController";

const prisma = new PrismaClient();

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderType, // 'MARKETPLACE' or 'POOJA'
            referenceId, // For POOJA, it's null initially. For legacy, it might be ID.
            orderData, // Full order details for creation
            userId // Required if creating record now
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "razorpay_secret_placeholder")
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        // Payment is verified
        if (orderType === "MARKETPLACE") {
            // 1. Create the order now
            const newOrder = await createVerifiedOrder(orderData, userId);
            return res.status(200).json({ success: true, message: "Order created successfully", data: newOrder });

        } else if (orderType === "POOJA") {
            // Full creation logic for Pooja
            const { poojaId, packageName, packagePrice, devoteeName, devoteePhone, devoteeEmail, bookingDate, address, specialRequests } = orderData;

            const pooja = await prisma.pooja.findUnique({ where: { id: poojaId }, include: { temple: true } });
            if (!pooja) return res.status(404).json({ success: false, message: "Pooja not found" });

            const commissionData = await getCommissionForAmount(packagePrice, SlabType.TEMPLE, pooja.templeId || undefined, CommissionCategory.POOJA);

            const booking = await prisma.$transaction(async (tx) => {
                const b = await tx.poojaBooking.create({
                    data: {
                        userId, poojaId, templeId: pooja.templeId as string,
                        packageName, packagePrice, devoteeName, devoteePhone, devoteeEmail, bookingDate, address, specialRequests,
                        status: 'BOOKED', commissionAmount: commissionData.totalCommission, netEarning: packagePrice
                    }
                });

                await tx.templeLedger.create({
                    data: {
                        templeId: pooja.templeId, amount: packagePrice, grossAmount: packagePrice,
                        commission: commissionData.totalCommission, type: "POOJA_EARNING", sourceId: b.id,
                        description: `Pooja Booking: ${pooja.name}`, status: "COMPLETED"
                    }
                });
                return b;
            });

            return res.status(200).json({ success: true, message: "Booking confirmed", data: booking });
        }

        return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
