import { Request, Response } from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import razorpay from "../lib/razorpay";
import { sendBookingReceiptEmail } from "../services/bookingMailService";
import { sendWhatsAppMessage } from "../services/whatsappService";
import { getEnglish } from "../utils/localization";
import { generateDonationReceiptBuffer } from "./devotee/donationController";
import { sendDonationReceiptEmail } from "../services/donationMailService";

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

            try {
                const { createVerifiedOrder } = require('./marketplace/productOrderController');
                await createVerifiedOrder(orderData, userId);
            } catch (orderErr: any) {
                const msg: string = orderErr?.message || "";

                // Stock ran out — possibly because another user grabbed the last unit
                if (msg.startsWith("OUT_OF_STOCK:")) {
                    const parts = msg.split(":");
                    // parts[2] = remaining stock count (could be 0)
                    const remaining = parts[2] !== undefined ? Number(parts[2]) : 0;
                    return res.status(409).json({
                        success: false,
                        code: "OUT_OF_STOCK",
                        count: remaining,
                        message: remaining === 0
                            ? "This product is currently unavailable (out of stock). Your payment will be refunded."
                            : `Only ${remaining} item(s) are available. Your full order cannot be fulfilled at this time. Your payment will be refunded.`,
                    });
                }

                // Product was deactivated / deleted
                if (msg.startsWith("PRODUCT_UNAVAILABLE:")) {
                    return res.status(409).json({
                        success: false,
                        code: "PRODUCT_UNAVAILABLE",
                        message: "One or more products are currently unavailable. Your payment will be refunded.",
                    });
                }

                // Unknown order creation error — re-throw so outer catch handles it
                throw orderErr;
            }
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
                        poojaName: getEnglish(updatedBooking.pooja.name),
                        templeName: getEnglish((updatedBooking.temple as any)?.name) || "Dev Bhakti",
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
                        getEnglish(updatedBooking.pooja.name)
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
                            getEnglish(updatedBooking.pooja.name),
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
                const poojaEn = getEnglish(updatedBooking.pooja.name);
                const poojaHi = "पूजा"; // Generic fallback or we can use poojaEn if translation parsing is complex here
                const dateStr = new Date(updatedBooking.bookingDate as string).toLocaleDateString();
                await notifyUser(updatedBooking.userId, 'devotee', {
                    title: 'Pooja Booking Confirmed! 🙏',
                    body: `Your booking for "${poojaEn}" has been confirmed for ${dateStr}.`,
                    data: { 
                        link: `/profile/bookings`, 
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
                    const poojaName = getEnglish(updatedBooking.pooja.name);
                    await notifyUser(updatedBooking.temple.userId, 'temple_admin', {
                        title: 'New Pooja Booking Received! 🔔',
                        body: `Devotee ${updatedBooking.devoteeName} booked "${poojaName}" for ${new Date(updatedBooking.bookingDate as string).toLocaleDateString()}.`,
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
        } else if (orderType === "PHOTOGRAPHY") {
            const updatedBooking = await prisma.photographyBooking.update({
                where: { id: referenceId },
                include: {
                    temple: true,
                    package: true
                },
                data: {
                    status: "BOOKED",
                },
            });

            // Create ledger entry for photography earning
            await prisma.templeLedger.create({
                data: {
                    templeId: updatedBooking.templeId,
                    amount: updatedBooking.packagePrice,
                    grossAmount: updatedBooking.totalAmount,
                    commission: updatedBooking.platformFee,
                    type: "PHOTOGRAPHY_EARNING",
                    sourceId: updatedBooking.id,
                    description: `Photography: ${getEnglish(updatedBooking.package.name)}`,
                    status: "COMPLETED"
                }
            });

            // Notify Devotee via Push Notification
            try {
                if (updatedBooking.userId) {
                    const { notifyUser } = require("../services/firebaseService");
                    const pkgName = getEnglish(updatedBooking.package.name);
                    await notifyUser(updatedBooking.userId, 'devotee', {
                        title: 'Photography Pass Approved! 📸',
                        body: `Your pass for "${pkgName}" has been issued.`,
                        data: {
                            link: `/profile/bookings`,
                            type: 'PHOTO_BOOKING',
                            bookingId: updatedBooking.id
                        }
                    });
                }
            } catch (pNotifyErr) {
                console.error("Failed to send push notification:", pNotifyErr);
            }

            // Return booking details for frontend success screen
            return res.status(200).json({ 
                success: true, 
                message: "Payment verified successfully",
                data: {
                    bookingId: updatedBooking.id,
                    displayId: updatedBooking.displayId,
                    packageName: getEnglish(updatedBooking.package.name),
                    bookingDate: updatedBooking.bookingDate,
                    timeSlot: updatedBooking.timeSlot,
                    totalAmount: updatedBooking.totalAmount,
                    packagePrice: updatedBooking.packagePrice,
                    platformFee: updatedBooking.platformFee,
                    status: "BOOKED"
                }
            });
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
                include: { temple: true, mandal: true }
            });

            if (donation && donation.templeId) {
                await prisma.templeLedger.create({
                    data: {
                        templeId: donation.templeId,
                        amount: donation.netEarning || donation.amount,
                        grossAmount: donation.amount + (donation.commissionAmount || 0),
                        commission: donation.commissionAmount || 0,
                        type: "DONATION_EARNING",
                        sourceId: donation.id,
                        description: `Donation: ${donation.donorName}${donation.isAnonymous ? ' (Anonymous)' : ''}`,
                        status: "COMPLETED"
                    }
                });
            } else if (donation && donation.mandalId) {
                await prisma.mandalLedger.create({
                    data: {
                        mandalId: donation.mandalId,
                        amount: donation.netEarning || donation.amount,
                        grossAmount: donation.amount + (donation.commissionAmount || 0),
                        commission: donation.commissionAmount || 0,
                        type: "DONATION_EARNING",
                        sourceId: donation.id,
                        description: `Donation: ${donation.donorName}${donation.isAnonymous ? ' (Anonymous)' : ''}`,
                        status: "COMPLETED"
                    }
                });
            }
            
            if (donation) {

                // Send WhatsApp Confirmation
                try {
                    const phone = donation.donorPhone.startsWith('+') ? donation.donorPhone : `+91${donation.donorPhone}`;
                    const placeName = getEnglish(donation.temple?.name) || getEnglish(donation.mandal?.name) || "Dev Bhakti";
                    await sendWhatsAppMessage(
                        phone,
                        donation.donorName,
                        "donation_confirmation",
                        [
                            donation.donorName,
                            placeName
                        ]
                    );
                } catch (waError) {
                    console.error("Failed to send donation WhatsApp:", waError);
                }

                // Notify Devotee, Temple Admin, and Platform Admins via Push Notification
                try {
                    const { notifyUser, notifyAdmins } = require("../services/firebaseService");
                    
                    if (donation.userId) {
                        const placeName = getEnglish(donation.temple?.name) || getEnglish(donation.mandal?.name) || "Dev Bhakti";
                        await notifyUser(donation.userId, 'devotee', {
                            title: 'Donation Successful! 🙏',
                            body: `Thank you for your generous donation of ₹${donation.amount} to ${placeName}.`,
                            data: {
                                link: `/profile`,
                                type: 'DONATION_SUCCESS',
                                donationId: donation.id
                            }
                        });

                        // Sync email to profile if missing
                        try {
                            const user = await prisma.user.findUnique({ where: { id: donation.userId } });
                            if (user && !user.email) {
                                // Check if email is already taken by someone else
                                const existingUserWithEmail = await prisma.user.findFirst({
                                    where: { email: donation.donorEmail }
                                });

                                if (!existingUserWithEmail) {
                                    await prisma.user.update({
                                        where: { id: donation.userId },
                                        data: { email: donation.donorEmail }
                                    });
                                    console.log(`Synced donor email ${donation.donorEmail} to user ${donation.userId}`);
                                } else {
                                    console.log(`Email ${donation.donorEmail} already belongs to another user, skipping sync.`);
                                }
                            }
                        } catch (syncErr) {
                            console.error("Failed to sync donor email to profile:", syncErr);
                        }
                    }

                    // Send Email Receipt
                    if (donation.donorEmail) {
                        try {
                            const receiptData = await generateDonationReceiptBuffer(donation.id);
                            if (receiptData) {
                                const placeName = getEnglish(donation.temple?.name) || getEnglish(donation.mandal?.name) || "Dev Bhakti";
                                await sendDonationReceiptEmail({
                                    donationId: donation.id,
                                    donorName: donation.donorName,
                                    donorPhone: donation.donorPhone,
                                    donorEmail: donation.donorEmail,
                                    templeName: placeName,
                                    amount: donation.amount,
                                    status: "SUCCESSFUL",
                                    createdAt: donation.createdAt.toISOString(),
                                    isAnonymous: donation.isAnonymous,
                                    is80GRequired: donation.is80GRequired,
                                    panNumber: donation.panNumber || undefined,
                                    address: donation.address || undefined,
                                    message: donation.message || undefined,
                                    displayId: donation.displayId || undefined
                                }, receiptData.buffer);
                                console.log(`Donation receipt email sent to ${donation.donorEmail}`);
                            }
                        } catch (emailErr) {
                            console.error("Failed to send donation receipt email:", emailErr);
                        }
                    }

                    if (donation.temple && donation.temple.userId) {
                        await notifyUser(donation.temple.userId, 'temple_admin', {
                            title: 'New Donation Received! 💰',
                            body: `${donation.isAnonymous ? 'An anonymous devotee' : donation.donorName} donated ₹${donation.amount} to your temple.`,
                            data: {
                                link: `/temples/dashboard`,
                                type: 'NEW_DONATION',
                                donationId: donation.id
                            }
                        });
                    }
                    
                    await notifyAdmins({
                        title: 'New Platform Donation! 🎉',
                        body: `₹${donation.amount} donated by ${donation.isAnonymous ? 'Anonymous' : donation.donorName} to ${getEnglish(donation.temple?.name) || "Dev Bhakti"}.`,
                        data: {
                            link: `/admin/donation`,
                            type: 'NEW_DONATION_ADMIN',
                            donationId: donation.id
                        }
                    });

                } catch (notifyErr) {
                    console.error("Failed to send donation push notifications:", notifyErr);
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
        } else if (orderType === "PHOTOGRAPHY" && referenceId) {
            await prisma.photographyBooking.update({
                where: { id: referenceId },
                data: { status: "CANCELLED" }
            });
        } else if (orderType === "DONATION" && referenceId) {
            await prisma.donation.update({
                where: { id: referenceId },
                data: { status: "FAILED" }
            });
        } else if (orderType === "MARKETPLACE" && orderData && userId) {
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
