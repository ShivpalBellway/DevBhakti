import { Request, Response } from "express";
import crypto from "crypto";
import { PrismaClient, SlabType, CommissionCategory } from "@prisma/client";
import razorpay from "../lib/razorpay";
import { createVerifiedOrder } from "./marketplace/productOrderController";
import { getCommissionForAmount } from "./admin/commissionSlabController";
import { notifyUser } from "../services/firebaseService";

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
            // Updated logic: Check if booking already exists and update it
            const { bookingId, poojaId, packageName, packagePrice, devoteeName, devoteePhone, devoteeEmail, bookingDate, address, specialRequests } = orderData;
            const targetBookingId = bookingId || referenceId;

            const pooja = await prisma.pooja.findUnique({ where: { id: poojaId }, include: { temple: true } });
            if (!pooja) return res.status(404).json({ success: false, message: "Pooja not found" });

            const commissionData = await getCommissionForAmount(packagePrice, SlabType.TEMPLE, pooja.templeId || undefined, CommissionCategory.POOJA);

            const booking = await prisma.$transaction(async (tx) => {
                let b;
                if (targetBookingId) {
                    b = await tx.poojaBooking.update({
                        where: { id: targetBookingId },
                        data: {
                            status: 'BOOKED',
                            commissionAmount: commissionData.totalCommission,
                            netEarning: packagePrice
                        }
                    });
                } else {
                    // Fallback to creation for legacy clients
                    b = await tx.poojaBooking.create({
                        data: {
                            userId, poojaId, templeId: pooja.templeId as string,
                            packageName, packagePrice, devoteeName, devoteePhone, devoteeEmail, bookingDate, address, specialRequests,
                            status: 'BOOKED', commissionAmount: commissionData.totalCommission, netEarning: packagePrice
                        }
                    });
                }

                await tx.templeLedger.create({
                    data: {
                        templeId: pooja.templeId, amount: packagePrice, grossAmount: packagePrice,
                        commission: commissionData.totalCommission, type: "POOJA_EARNING", sourceId: b.id,
                        description: `Pooja Booking: ${pooja.name}`, status: "COMPLETED"
                    }
                });
                return b;
            });


            // Notify Devotee
            await notifyUser(userId, 'devotee', {
                title: 'Pooja Booking Confirmed! 🙏',
                body: `Your booking for ${pooja.name} on ${new Date(booking.bookingDate as string).toLocaleDateString()} is confirmed.`,
                data: { link: '/profile/bookings', bookingId: booking.id }
            });

            // Notify Temple
            if (pooja.templeId) {
                await notifyUser(pooja.templeId, 'temple_admin', {
                    title: 'New Pooja Booking! ✨',
                    body: `${devoteeName} has booked ${pooja.name} for ${new Date(booking.bookingDate as string).toLocaleDateString()}.`,
                    data: { link: '/temples/dashboard/bookings', bookingId: booking.id }
                });
            }

            return res.status(200).json({ success: true, message: "Booking confirmed", data: booking });
        } else if (orderType === "DONATION") {
            const { donationId } = orderData; // Expect donationId to be passed in orderData or referenceId

            const donation = await prisma.donation.findUnique({
                where: { id: donationId || referenceId },
                include: { temple: true }
            });

            if (!donation) return res.status(404).json({ success: false, message: "Donation record not found" });

            const updatedDonation = await prisma.$transaction(async (tx) => {
                const d = await tx.donation.update({
                    where: { id: donation.id },
                    data: {
                        status: 'SUCCESS',
                        paymentMethod: req.body.paymentMethod || 'Razorpay'
                    }
                });

                await tx.templeLedger.create({
                    data: {
                        templeId: donation.templeId,
                        amount: donation.amount,
                        grossAmount: donation.amount,
                        commission: 0, // Donations usually have 0 commission in this context or handle as per policy
                        type: "DONATION_EARNING",
                        sourceId: d.id,
                        description: `Donation: ${donation.donorName} for ${donation.temple.name}`,
                        status: "COMPLETED"
                    }
                });
                return d;
            });


            // Notify Devotee
            if (userId || donation.userId) {
                await notifyUser(userId || (donation.userId as string), 'devotee', {
                    title: 'Donation Successful! ❤️',
                    body: `Thank you for your generous donation of ₹${donation.amount} to ${donation.temple.name}.`,
                    data: { link: '/profile/donations', donationId: updatedDonation.id }
                });
            }

            // Notify Temple
            if (donation.templeId) {
                await notifyUser(donation.templeId, 'temple_admin', {
                    title: 'New Donation Received! 🙏',
                    body: `You have received a new donation of ₹${donation.amount} from ${donation.donorName}.`,
                    data: { link: '/temples/dashboard/finance', donationId: updatedDonation.id }
                });
            }

            return res.status(200).json({ success: true, message: "Donation successful", data: updatedDonation });
        }

        return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
