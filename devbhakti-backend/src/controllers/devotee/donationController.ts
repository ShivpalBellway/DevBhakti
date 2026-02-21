import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import razorpay from "../../lib/razorpay";

const prisma = new PrismaClient();

export const initiateDonation = async (req: Request, res: Response) => {
    try {
        const {
            templeId,
            amount,
            donorName,
            donorPhone,
            donorEmail,
            isAnonymous,
            is80GRequired,
            panNumber,
            address,
            message,
            userId
        } = req.body;

        if (!templeId || !amount || !donorName || !donorPhone || !donorEmail) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const temple = await prisma.temple.findUnique({ where: { id: templeId } });
        if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });

        // Create Razorpay Order
        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit
            currency: "INR",
            receipt: `don_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Save Pending Donation Record
        const donation = await prisma.donation.create({
            data: {
                templeId,
                amount,
                donorName,
                donorPhone,
                donorEmail,
                isAnonymous: !!isAnonymous,
                is80GRequired: !!is80GRequired,
                panNumber,
                address,
                message,
                userId: userId || null,
                status: "PENDING",
                razorpayOrderId: razorpayOrder.id,
            }
        });

        res.status(200).json({
            success: true,
            order: razorpayOrder,
            donationId: donation.id
        });
    } catch (error: any) {
        console.error("Initiate Donation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
