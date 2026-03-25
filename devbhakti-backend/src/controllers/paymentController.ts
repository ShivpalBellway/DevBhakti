import { Request, Response } from "express";

import crypto from "crypto";

import { PrismaClient } from "@prisma/client";

import razorpay from "../lib/razorpay";
import { sendBookingReceiptEmail } from "../services/bookingMailService";
import { sendWhatsAppMessage } from "../services/whatsappService";

const prisma = new PrismaClient();



export const verifyPayment = async (req: Request, res: Response) => {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderType, // 'MARKETPLACE' or 'POOJA'
            referenceId, // Our internal Order ID or Booking ID
            orderData, // For MARKETPLACE
            userId,    // For MARKETPLACE
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
            if (!orderData || !userId) {
                return res.status(400).json({ success: false, message: "Missing orderData or userId for Marketplace checkout" });
            }

            const { createVerifiedOrder } = require('./marketplace/productOrderController');
            await createVerifiedOrder(orderData, userId);
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

            // Send WhatsApp Confirmation
            try {
                const phone = updatedBooking.devoteePhone.startsWith('+') ? updatedBooking.devoteePhone : `+91${updatedBooking.devoteePhone}`;
                await sendWhatsAppMessage(
                    phone,
                    updatedBooking.devoteeName,
                    "booking_confirmed",
                    [
                        updatedBooking.devoteeName,
                        updatedBooking.pooja.name
                    ]
                );
            } catch (waError) {
                console.error("Failed to send booking WhatsApp:", waError);
            }

            // Notify Temple Admin via WhatsApp
            try {
                if (updatedBooking.temple?.phone) {
                    const templePhone = updatedBooking.temple.phone.startsWith('+') ? updatedBooking.temple.phone : `+91${updatedBooking.temple.phone}`;
                    await sendWhatsAppMessage(
                        templePhone,
                        "Temple Admin",
                        "temple_admin_new_booking_received",
                        [
                            updatedBooking.devoteeName,
                            updatedBooking.pooja.name,
                            updatedBooking.bookingDate || "N/A"
                        ]
                    );
                }
            } catch (adminWaError) {
                console.error("Failed to send Temple Admin WhatsApp:", adminWaError);
            }
            // Notify Devotee via Push Notification
            try {
                const { notifyUser } = require("../services/firebaseService");
                await notifyUser(updatedBooking.userId, 'devotee', {
                    title: 'Pooja Booking Confirmed! 🙏',
                    body: `Your booking for "${updatedBooking.pooja.name}" has been confirmed for ${new Date(updatedBooking.bookingDate as string).toLocaleDateString()}.`,
                    data: { 
                        link: `/profile/bookings/${updatedBooking.id}`, 
                        type: 'POOJA_BOOKING',
                        bookingId: updatedBooking.id 
                    }
                });
            } catch (pNotifyErr) {
                console.error("Failed to send devotee push notification:", pNotifyErr);
            }

            // Notify Temple Admin via Push Notification
            try {
                if (updatedBooking.temple?.userId) {
                    const { notifyUser } = require("../services/firebaseService");
                    await notifyUser(updatedBooking.temple.userId, 'temple_admin', {
                        title: 'New Pooja Booking Received! 🔔',
                        body: `Devotee ${updatedBooking.devoteeName} booked "${updatedBooking.pooja.name}" for ${new Date(updatedBooking.bookingDate as string).toLocaleDateString()}.`,
                        data: { 
                            link: `/temples/dashboard/bookings/${updatedBooking.id}`, 
                            type: 'NEW_POOJA_BOOKING',
                            bookingId: updatedBooking.id 
                        }
                    });
                }
            } catch (tNotifyErr) {
                console.error("Failed to send temple admin push notification:", tNotifyErr);
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
                        commission: 0,
                        type: "DONATION_EARNING",
                        sourceId: donation.id,
                        description: `Donation: ${donation.donorName}${donation.isAnonymous ? ' (Anonymous)' : ''}`,
                        status: "COMPLETED"
                    }
                });

                // Send WhatsApp Confirmation
                try {
                    const phone = donation.donorPhone.startsWith('+') ? donation.donorPhone : `+91${donation.donorPhone}`;
                    await sendWhatsAppMessage(
                        phone,
                        donation.donorName,
                        "donation_confirmation",
                        [
                            donation.donorName,
                            donation.temple?.name || "Dev Bhakti"
                        ]
                    );
                } catch (waError) {
                    console.error("Failed to send donation WhatsApp:", waError);
                }
            }

        }



        return res.status(200).json({ success: true, message: "Payment verified successfully" });

    } catch (error: any) {

        console.error("Payment Verification Error:", error);

        return res.status(500).json({ success: false, message: error.message });

    }

};


export const paymentFailed = async (req: Request, res: Response) => {
    try {
        const {
            orderType, // 'MARKETPLACE', 'POOJA', 'DONATION'
            referenceId, // For POOJA and DONATION (DB ID)
            orderData, // For MARKETPLACE (contains all items/address)
            userId,
            phone,
            userName,
            error
        } = req.body;

        console.log(`Payment Failed: Type=${orderType}, User=${userId}, Phone=${phone}`);

        if (orderType === "POOJA" && referenceId) {
            await prisma.poojaBooking.update({
                where: { id: referenceId },
                data: { status: "CANCELLED" }
            });
        } else if (orderType === "DONATION" && referenceId) {
            await prisma.donation.update({
                where: { id: referenceId },
                data: { status: "FAILED" }
            });
        } else if (orderType === "MARKETPLACE" && orderData && userId) {
            // For Marketplace, we create the order record only on success usually.
            // But for tracking failures, we create a FAILED record now.
            const { items, totalAmount, shippingAddress, paymentMethod, platformFee } = orderData;
            
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.create({
                    data: {
                        userId,
                        totalAmount,
                        paymentMethod,
                        shippingAddress,
                        status: "CANCELLED",
                        paymentStatus: "FAILED",
                        platformFee: platformFee || 0,
                    }
                });

                // Create SubOrders marked as FAILED
                const productIds = items.map((item: any) => item.productId);
                const products = await tx.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, templeId: true, sellerId: true }
                });
                const productMap = new Map(products.map(p => [p.id, p]));

                const groups: Record<string, any[]> = {};
                items.forEach((item: any) => {
                    const info = productMap.get(item.productId);
                    const key = info?.templeId ? `temple_${info.templeId}` : (info?.sellerId ? `seller_${info.sellerId}` : "admin");
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(item);
                });

                for (const [key, groupItems] of Object.entries(groups)) {
                    const subOrderTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const templeId = key.startsWith("temple_") ? key.replace("temple_", "") : null;
                    const sellerId = key.startsWith("seller_") ? key.replace("seller_", "") : null;

                    await tx.subOrder.create({
                        data: {
                            orderId: order.id,
                            templeId,
                            sellerId,
                            totalAmount: subOrderTotal,
                            status: "FAILED",
                            items: {
                                create: groupItems.map((item) => ({
                                    productId: item.productId,
                                    variantId: item.variantId,
                                    variantName: item.variantName,
                                    price: item.price,
                                    quantity: item.quantity,
                                })),
                            },
                        },
                    });
                }
            });
        }

        // Trigger WhatsApp notification for failure
        if (phone) {
            try {
                const { sendWhatsAppMessage } = require('../services/whatsappService');
                await sendWhatsAppMessage(
                    phone.startsWith('+') ? phone : `+91${phone}`,
                    userName || 'Bhakt',
                    "payment_failed",
                    []
                );
            } catch (waErr) {
                console.error("WhatsApp Failure Error:", waErr);
            }
        }

        return res.status(200).json({ success: true, message: "Failure recorded" });
    } catch (error: any) {
        console.error("Payment Failure Recording Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
