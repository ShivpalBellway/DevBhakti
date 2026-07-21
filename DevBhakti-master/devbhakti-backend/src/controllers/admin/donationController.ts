import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import ExcelJS from 'exceljs';
import { localize } from "../../utils/localization";
import { sendEmail } from "../../utils/sendEmail";
import { generateReceiptHTML } from "../../utils/donationReceipt";
import { generateDonationDisplayId, generateCustomId } from "../../utils/idGenerator";
import { getCommissionForAmount } from "../admin/commissionSlabController";
import { CommissionCategory, SlabType } from "@prisma/client";
import { validateDonationAmount, validatePhoneNumber } from "../../utils/donationValidation";

export const getAllDonations = async (req: Request, res: Response) => {
    try {
        const { search, status, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10, donationType, templeId, donationSource } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const lang = (req.headers['x-lang'] as string) || (req.query.lang as string) || 'en';

        const where: any = {};

        // Status Filtering
        if (status && status !== "all") {
            where.status = status;
        } else if (!status) {
            // Default behavior if no status provided
            where.status = "SUCCESS";
        }

        // Donation Type Filtering
        // ONLINE: donations with razorpayOrderId (from Razorpay payment gateway)
        // OFFLINE: donations without razorpayOrderId (manual entries)
        if (donationType) {
            if (donationType === "ONLINE") {
                where.razorpayOrderId = { not: null };
            } else if (donationType === "OFFLINE") {
                where.razorpayOrderId = null;
            }
        }

        // Temple Filtering
        if (templeId && templeId !== 'all') {
            where.templeId = String(templeId);
        }

        // Donation Source Filtering (TEMPLE vs MANDAL vs ALL)
        if (donationSource === 'TEMPLE') {
            where.templeId = { not: null };
            where.mandalId = null;
        } else if (donationSource === 'MANDAL') {
            where.mandalId = { not: null };
            where.templeId = null;
        }

        // Search across multiple fields
        if (search) {
            where.OR = [
                { id: { contains: String(search), mode: 'insensitive' } },
                { displayId: { contains: String(search), mode: 'insensitive' } },
                { donorName: { contains: String(search), mode: 'insensitive' } },
                { userId: { contains: String(search), mode: 'insensitive' } },
                { temple: { name: { path: ['en'], string_contains: String(search) } } }
            ];

        }

        // Period Filtering
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) {
                const end = new Date(String(endDate));
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [donations, total] = await Promise.all([
            prisma.donation.findMany({
                where,
                include: {
                    temple: { select: { name: true } } as any,
                    mandal: { select: { name: true } } as any
                },
                orderBy: { [String(sortBy)]: sortOrder as any },
                skip,
                take: Number(limit)
            }),
            prisma.donation.count({ where })
        ]);

        const formattedDonations = donations.map(d => {
            const lt = (d as any).temple ? localize((d as any).temple, lang) : null;
            const lm = (d as any).mandal ? localize((d as any).mandal, lang) : null;
            return {
                id: d.id,
                donorName: d.donorName,
                donorPhone: d.donorPhone,
                donorEmail: d.donorEmail,
                templeName: lt?.name || null,
                templeId: d.templeId || null,
                mandalName: lm?.name || null,
                mandalId: d.mandalId || null,
                donationSource: d.mandalId ? 'MANDAL' : 'TEMPLE',
                amount: d.amount,
                commissionAmount: d.commissionAmount || 0,
                netEarning: d.netEarning || d.amount,
                status: d.status,
                createdAt: d.createdAt,
                isAnonymous: d.isAnonymous,
                is80GRequired: d.is80GRequired,
                panNumber: d.panNumber,
                address: d.address,
                message: d.message,
                displayId: d.displayId,
                paymentMethod: d.paymentMethod,
                donationType: d.razorpayOrderId ? "ONLINE" : "OFFLINE"
            };
        });

        res.status(200).json({
            success: true,
            data: formattedDonations,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error("Get All Donations Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDonationStats = async (req: Request, res: Response) => {
    try {
        const stats = await prisma.donation.groupBy({
            by: ['status'],
            _sum: { amount: true },
            _count: { id: true }
        });

        const result = {
            totalAmount: 0,
            successCount: 0,
            pendingCount: 0,
            failedCount: 0
        };

        stats.forEach(s => {
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
        console.error("Get Donation Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDonation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.donation.delete({ where: { id: id as string } });
        res.status(200).json({ success: true, message: "Donation record deleted" });
    } catch (error: any) {
        console.error("Delete Donation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};




export const createDonation = async (req: Request, res: Response) => {
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
            paymentMethod,
            status = "SUCCESS",
            createdAt,
        } = req.body;

        if (!templeId || !amount || !donorName || !donorPhone || !donorEmail) {
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

        const temple = await prisma.temple.findUnique({ where: { id: templeId } });
        if (!temple) {
            return res.status(404).json({ success: false, message: "Temple not found" });
        }

        // ✅ Donation commission calculation (2%)
        const DONATION_COMMISSION_RATE = 0.02;
        const templeAmount = Number(amount);
        const commissionAmount = templeAmount * DONATION_COMMISSION_RATE;
        const grossAmount = templeAmount + commissionAmount;

        const displayId = await generateDonationDisplayId();

        // 1️⃣ Find existing DEVOTEE user based on donorPhone, but do not create a new user for offline donation
        let userId: string | null = null;
        if (donorPhone) {
            // Normalize phone to match login system (+91XXXXXXXXXX)
            let cleanedPhone = String(donorPhone).replace(/\D/g, '');
            if (cleanedPhone.startsWith('00')) cleanedPhone = cleanedPhone.substring(2);
            if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) cleanedPhone = cleanedPhone.substring(1);
            if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) { }
            else if (cleanedPhone.length === 10) cleanedPhone = '91' + cleanedPhone;
            if (cleanedPhone.length === 14 && cleanedPhone.startsWith('9191')) cleanedPhone = cleanedPhone.substring(2);
            const normalizedPhone = '+' + cleanedPhone;

            const existingUser = await prisma.user.findFirst({
                where: { phone: normalizedPhone, role: "DEVOTEE" }
            });

            if (existingUser) {
                userId = existingUser.id;
            }
        }

        // 2️⃣ Create donation record
        const donation = await prisma.donation.create({
            data: {
                displayId,
                userId,
                templeId,
                amount: templeAmount,
                commissionAmount,
                netEarning: templeAmount,
                donorName,
                donorPhone,
                donorEmail,
                isAnonymous: !!isAnonymous,
                is80GRequired: !!is80GRequired,
                panNumber,
                address,
                message,
                paymentMethod,
                status,
                createdAt: createdAt ? new Date(createdAt) : undefined,
            }
        });

        // 2️⃣ Create ledger entry for transaction list (if status is SUCCESS)
        if (status === "SUCCESS") {
            await prisma.templeLedger.create({
                data: {
                    templeId: templeId,
                    amount: templeAmount,           // Net (temple gets)
                    grossAmount: grossAmount,        // Gross (devotee paid)
                    commission: commissionAmount,    // Platform commission (2%)
                    type: "DONATION_EARNING",
                    sourceId: donation.id,
                    description: `Donation from ${donorName || donorPhone} of ₹${templeAmount}`,
                    status: "COMPLETED"
                }
            });
            console.log(`✅ Ledger entry created for donation ${donation.id}`);
        }

        res.status(200).json({ success: true, data: donation, message: "Donation created successfully" });
    } catch (error: any) {
        console.error("Create Donation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const downloadDonationsExcel = async (req: Request, res: Response) => {
    try {
        const lang = (req.headers['x-lang'] as string) || (req.query.lang as string) || 'en';
        const { donationType } = req.query;
        console.log("Starting Excel Export...");

        // 1. Database se data layein with donationType filtering
        const where: any = {};
        
        if (donationType) {
            if (donationType === "ONLINE") {
                where.razorpayOrderId = { not: null };
            } else if (donationType === "OFFLINE") {
                where.razorpayOrderId = null;
            }
        }
        
        const donations = await prisma.donation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                temple: {
                    select: { name: true }
                } as any
            }
        });

        // 2. Naya Workbook aur Worksheet banayein
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Donations Report');

        // 3. Columns define karein (Headers)
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 25 },
            { header: 'Donor Name', key: 'donorName', width: 30 },
            { header: 'Email', key: 'donorEmail', width: 30 },
            { header: 'Phone', key: 'donorPhone', width: 15 },
            { header: 'Temple', key: 'templeName', width: 25 },
            { header: 'Gross Amount', key: 'amount', width: 15 },
            { header: 'Commission', key: 'commissionAmount', width: 15 },
            { header: 'Net Earning', key: 'netEarning', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'PAN', key: 'panNumber', width: 20 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'Message', key: 'message', width: 50 },
        ];

        // 4. Styling apply karein (Headers ko sundar banayein)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                // Header row ke liye style
                row.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF7C4624' }, // Brown background (aapka theme color)
                };
            }
            row.alignment = { vertical: 'middle', wrapText: true };
        });

        // 5. Data add karein
        donations.forEach((d: any) => {
            const lt = (d as any).temple ? localize((d as any).temple, lang) : null;
            worksheet.addRow({
                id: d.id,
                donorName: d.donorName,
                donorEmail: d.donorEmail,
                donorPhone: d.donorPhone,
                templeName: lt?.name || "N/A",
                amount: d.amount,
                commissionAmount: d.commissionAmount || 0,
                netEarning: d.netEarning || d.amount,
                status: d.status,
                date: d.createdAt.toISOString().split('T')[0],
                panNumber: d.panNumber,
                address: d.address,
                message: d.message,
            });
        });

        // 6. Excel file ko Buffer me convert karein
        const buffer = await workbook.xlsx.writeBuffer();

        // 7. Response headers set karein
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=donations_report_${new Date().toISOString().slice(0, 10)}.xlsx`);

        // 8. Response bhejein
        return res.status(200).send(buffer);

    } catch (error: any) {
        console.error("Excel Export Error:", error);
        return res.status(500).json({ success: false, message: "Failed to export Excel" });
    }
};

export const sendDonationEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const lang = (req.headers['x-lang'] as string) || (req.query.lang as string) || 'en';

        const donation = await prisma.donation.findUnique({
            where: { id: id as string },
            include: { temple: { select: { name: true } } as any }
        });

        if (!donation) {
            return res.status(404).json({ success: false, message: "Donation not found" });
        }

        if (!donation.donorEmail) {
            return res.status(400).json({ success: false, message: "Donor email not available" });
        }

        const lt = (donation as any).temple ? localize((donation as any).temple, lang) : null;
        
        const receiptData = {
            ...donation,
            templeName: lt?.name || "Dev Bhakti Sacred Offering"
        };

        const html = generateReceiptHTML(receiptData as any);

        const emailResult = await sendEmail(
            donation.donorEmail,
            `Dev Bhakti - Donation Receipt (${donation.displayId || donation.id})`,
            `Thank you for your donation of ₹${donation.amount}.`,
            html,
            [
                {
                    filename: `Donation_Receipt_${donation.displayId || donation.id}.html`,
                    content: Buffer.from(html, 'utf-8'),
                    contentType: 'text/html'
                }
            ]
        );

        if (emailResult.success) {
            return res.status(200).json({ success: true, message: "Receipt sent successfully" });
        } else {
            console.error("Email send failed:", emailResult.error);
            return res.status(500).json({ success: false, message: "Failed to send email", error: emailResult.error });
        }

    } catch (error: any) {
        console.error("Send Donation Email Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};