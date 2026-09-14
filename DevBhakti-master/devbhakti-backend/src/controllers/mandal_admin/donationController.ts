import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { getLang, localize } from "../../utils/localization";
import { generateDonationDisplayId } from "../../utils/idGenerator";
import { getCommissionForAmount } from "../admin/commissionSlabController";
import { CommissionCategory, SlabType } from "@prisma/client";
import { validateDonationAmount, validatePhoneNumber, validatePincode } from "../../utils/donationValidation";

export const getMandalDonations = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const { search, status, page = 1, limit = 10, startDate, endDate, donationType } = req.query;
        const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

        const where: any = { mandalId };

        if (status && status !== "all") {
            where.status = status;
        } else if (!status || status === "all") {
            where.status = "SUCCESS";
        }

        if (donationType) {
            if (donationType === "ONLINE") {
                where.OR = [
                    { razorpayOrderId: { not: null } },
                    { razorpayPaymentId: { not: null } }
                ];
            } else if (donationType === "OFFLINE") {
                where.razorpayOrderId = null;
                where.razorpayPaymentId = null;
            }
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(String(startDate));
            }
            if (endDate) {
                const end = new Date(String(endDate));
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        if (search) {
            where.OR = [
                { id: { contains: String(search), mode: 'insensitive' } },
                { donorName: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        const [donations, total] = await Promise.all([
            prisma.donation.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(String(limit), 10)
            }),
            prisma.donation.count({ where })
        ]);

        const lang = getLang(req);
        res.status(200).json({
            success: true,
            data: localize(donations, lang),
            pagination: {
                total,
                page: parseInt(String(page), 10),
                limit: parseInt(String(limit), 10),
                totalPages: Math.ceil(total / parseInt(String(limit), 10))
            }
        });
    } catch (error: any) {
        console.error("Get Mandal Donations Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMandalDonationStats = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;

        const stats = await prisma.donation.groupBy({
            by: ['status'],
            where: { mandalId },
            _sum: { amount: true },
            _count: { id: true }
        });

        // Calculate online and offline stats
        const onlineStats = await prisma.donation.aggregate({
            where: {
                mandalId,
                status: 'SUCCESS',
                razorpayOrderId: { not: null }
            },
            _sum: { amount: true },
            _count: { id: true }
        });

        const offlineStats = await prisma.donation.aggregate({
            where: {
                mandalId,
                status: 'SUCCESS',
                razorpayOrderId: null
            },
            _sum: { amount: true },
            _count: { id: true }
        });


        const result = {
            totalAmount: 0,
            successCount: 0,
            pendingCount: 0,
            failedCount: 0,
            totalDonors: 0,
            onlineAmount: onlineStats._sum.amount || 0,
            onlineCount: onlineStats._count.id || 0,
            offlineAmount: offlineStats._sum.amount || 0,
            offlineCount: offlineStats._count.id || 0
        };

        const uniqueDonors = await prisma.donation.groupBy({
            by: ['donorName'],
            where: { mandalId, status: 'SUCCESS' }
        });
        result.totalDonors = uniqueDonors.length;

        stats.forEach((s: any) => {
            if (s.status === "SUCCESS") {
                result.totalAmount = s._sum.amount || 0;
                result.successCount = s._count.id;
            } else if (s.status === "PENDING") {
                result.pendingCount = s._count.id;
            } else if (s.status === "FAILED") {
                result.failedCount = s._count.id;
            }
        });

        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("Get Mandal Donation Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMandalDonation = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const {
            amount,
            donorName,
            donorPhone,
            donorEmail,
            panNumber,
            address,
            message,
            paymentMethod,
            status = "SUCCESS",
            createdAt,
            pincode,
        } = req.body;

        if (!mandalId || !amount || !donorName || !donorPhone) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (!validateDonationAmount(amount)) {
            return res.status(400).json({
                success: false,
                message: "Donation amount must be between ₹1 and ₹999,999,999."
            });
        }

        if (!validatePhoneNumber(donorPhone)) {
            return res.status(400).json({
                success: false,
                message: "Donor phone must be 10 or 11 digits."
            });
        }

        if (pincode && !validatePincode(pincode)) {
            return res.status(400).json({
                success: false,
                message: "Pin code must be a 6 digit number."
            });
        }

        const mandal = await prisma.mandal.findUnique({ where: { id: mandalId } });
        if (!mandal) {
            return res.status(404).json({ success: false, message: "Mandal not found" });
        }

        const commissionData = await getCommissionForAmount(
            Number(amount),
            SlabType.MANDAL,
            mandalId,
            CommissionCategory.DONATION,
            true
        );

        const commissionAmount = commissionData.totalCommission || 0;
        const netEarning = Number(amount);
        const displayId = await generateDonationDisplayId();

        // Find or create user
        let userId: string | null = null;
        if (donorPhone) {
            let cleanedPhone = String(donorPhone).replace(/\D/g, '');
            if (cleanedPhone.startsWith('00')) cleanedPhone = cleanedPhone.substring(2);
            if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) cleanedPhone = cleanedPhone.substring(1);
            if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) { }
            else if (cleanedPhone.length === 10) cleanedPhone = '91' + cleanedPhone;
            if (cleanedPhone.length === 14 && cleanedPhone.startsWith('9191')) cleanedPhone = cleanedPhone.substring(2);
            const normalizedPhone = '+' + cleanedPhone;

            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: normalizedPhone },
                        { phone: cleanedPhone },
                        { phone: String(donorPhone) }
                    ],
                    role: "DEVOTEE"
                }
            });

            if (existingUser) {
                userId = existingUser.id;
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        name: existingUser.name || donorName,
                        email: existingUser.email || donorEmail || null,
                        address: existingUser.address || address || null
                    }
                });
            } else {
                const userDisplayId = `DEV-${Date.now().toString().slice(-6)}`;
                const newUser = await prisma.user.create({
                    data: {
                        displayId: userDisplayId,
                        name: donorName,
                        phone: normalizedPhone,
                        email: donorEmail || null,
                        address: address || null,
                        role: "DEVOTEE",
                        isVerified: true,
                        isActive: true
                    }
                });
                userId = newUser.id;
            }
        }

        const donation = await prisma.donation.create({
            data: {
                displayId,
                userId,
                mandalId,
                amount: Number(amount),
                commissionAmount,
                netEarning,
                donorName,
                donorPhone,
                donorEmail,
                panNumber,
                address,
                message,
                paymentMethod,
                status,
                createdAt: createdAt ? new Date(createdAt) : undefined,
            }
        });

        if (status === "SUCCESS") {
            const grossAmount = Number(amount) + commissionAmount;
            await prisma.mandalLedger.create({
                data: {
                    mandalId: mandalId,
                    amount: netEarning,
                    grossAmount: grossAmount,
                    commission: commissionAmount,
                    type: "DONATION_EARNING",
                    sourceId: donation.id,
                    description: `Offline Donation from ${donorName || donorPhone} of ₹${amount}`,
                    status: "COMPLETED",
                    createdAt: createdAt ? new Date(createdAt) : undefined,
                }
            });
            console.log(`✅ Ledger entry created for mandal donation ${donation.id}`);
        }

        res.status(200).json({ success: true, data: donation, message: "Mandal Donation created successfully" });
    } catch (error: any) {
        console.error("Create Mandal Donation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMandalDonation = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Donation id is required" });
        }

        const donation = await prisma.donation.findUnique({ where: { id: id as string } });
        if (!donation) {
            return res.status(404).json({ success: false, message: "Donation not found" });
        }

        if (donation.mandalId !== mandalId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this donation" });
        }

        await prisma.donation.delete({ where: { id: id as string } });

        return res.status(200).json({ success: true, message: "Donation deleted successfully" });
    } catch (error: any) {
        console.error("Delete Mandal Donation Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
