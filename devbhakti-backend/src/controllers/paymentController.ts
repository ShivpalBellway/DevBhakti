import { Request, Response } from "express";

import crypto from "crypto";

import { PrismaClient } from "@prisma/client";

import razorpay from "../lib/razorpay";



const prisma = new PrismaClient();



export const verifyPayment = async (req: Request, res: Response) => {

    try {

        const {

            razorpay_order_id,

            razorpay_payment_id,

            razorpay_signature,

            orderType, // 'MARKETPLACE' or 'POOJA'

            referenceId, // Our internal Order ID or Booking ID

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

            await prisma.order.update({

                where: { id: referenceId },

                data: {

                    paymentStatus: "PAID",

                    status: "BOOKED", // or whatever represents a paid order

                },

            });



            // Update SubOrders status too

            await prisma.subOrder.updateMany({

                where: { orderId: referenceId },

                data: { status: "PAID" },

            });



        } else if (orderType === "POOJA") {

            await prisma.poojaBooking.update({

                where: { id: referenceId },

                data: {

                    status: "BOOKED",

                },

            });



            // Update ledger status to COMPLETED (from PENDING)

            await prisma.templeLedger.updateMany({

                where: { sourceId: referenceId, type: "POOJA_EARNING" },

                data: { status: "COMPLETED" },

            });

        }



        return res.status(200).json({ success: true, message: "Payment verified successfully" });

    } catch (error: any) {

        console.error("Payment Verification Error:", error);

        return res.status(500).json({ success: false, message: error.message });

    }

};

