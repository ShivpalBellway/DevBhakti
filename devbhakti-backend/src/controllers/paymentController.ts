import { Request, Response } from "express";

import crypto from "crypto";

import { PrismaClient } from "@prisma/client";

import razorpay from "../lib/razorpay";

import { sendBookingReceiptEmail } from "../services/bookingMailService";



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

            const updatedBooking = await prisma.poojaBooking.update({

                where: { id: referenceId },

                include: {

                    pooja: true,

                    temple: true

                },

                data: {

                    status: "BOOKED",

                },

            });



            // Update ledger status to COMPLETED (from PENDING)

            await prisma.templeLedger.updateMany({

                where: { sourceId: referenceId, type: "POOJA_EARNING" },

                data: { status: "COMPLETED" },

            });



            // Send Email Receipt

            if (updatedBooking.devoteeEmail) {

                try {

                    await sendBookingReceiptEmail({

                        bookingId: updatedBooking.id,

                        devoteeName: updatedBooking.devoteeName,

                        devoteePhone: updatedBooking.devoteePhone,

                        devoteeEmail: updatedBooking.devoteeEmail,

                        poojaName: updatedBooking.pooja.name,

                        templeName: updatedBooking.temple?.name || "Dev Bhakti",

                        bookingDate: updatedBooking.bookingDate || "N/A",

                        packageName: updatedBooking.packageName,

                        packagePrice: updatedBooking.packagePrice,

                        platformFee: updatedBooking.platformFee,

                        totalAmount: updatedBooking.packagePrice + updatedBooking.platformFee,

                        status: "BOOKED",

                        createdAt: updatedBooking.createdAt.toISOString(),

                        gothra: updatedBooking.gothra || undefined,

                        kuldevi: updatedBooking.kuldevi || undefined,

                        kuldevta: updatedBooking.kuldevta || undefined,

                        dob: updatedBooking.dob || undefined,

                        anniversary: updatedBooking.anniversary || undefined,

                        additionalDevotees: updatedBooking.additionalDevotees as any

                    });

                } catch (emailError) {

                    console.error("Failed to send booking email:", emailError);

                    // We don't want to fail the payment verification if email fails

                }

            }

        } else if (orderType === "DONATION") {

            await prisma.donation.update({

                where: { id: referenceId },

                data: {

                    status: "SUCCESS",

                },

            });



            // Create ledger entry for donation earning

            const donation = await prisma.donation.findUnique({

                where: { id: referenceId },

                include: { temple: true }

            });



            if (donation && donation.templeId) {

                await prisma.templeLedger.create({

                    data: {

                        templeId: donation.templeId,

                        amount: donation.amount,

                        grossAmount: donation.amount,

                        commission: 0, // Assume 0 commission for donations for now

                        type: "DONATION_EARNING",

                        sourceId: donation.id,

                        description: `Donation: ${donation.donorName}${donation.isAnonymous ? ' (Anonymous)' : ''}`,

                        status: "COMPLETED"

                    }

                });

            }

        }



        return res.status(200).json({ success: true, message: "Payment verified successfully" });

    } catch (error: any) {

        console.error("Payment Verification Error:", error);

        return res.status(500).json({ success: false, message: error.message });

    }

};

