import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { getLang, localize, getEnglish } from "../../utils/localization";
import { sendEmail } from "../../utils/sendEmail";
import { generateReceiptHTML } from "../../utils/donationReceipt";
import { generateDonationDisplayId, generateCustomId } from "../../utils/idGenerator";
import { getCommissionForAmount } from "../admin/commissionSlabController";
import { CommissionCategory, SlabType } from "@prisma/client";
import { validateDonationAmount, validatePhoneNumber, validatePincode } from "../../utils/donationValidation";

export const getTempleDonations = async (req: Request, res: Response) => {
    try {
        const { templeId } = req.params; // Or from auth middleware if applicable
        const { search, status, page = 1, limit = 10, startDate, endDate, donationType } = req.query;
        const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

        const where: any = { templeId };

        if (status && status !== "all") {
            where.status = status;
        } else if (!status || status === "all") {
            // Default to showing only successful donations
            where.status = "SUCCESS";
        }

        if (donationType) {
            if (donationType === "ONLINE") {
                where.razorpayOrderId = { not: null };
            } else if (donationType === "OFFLINE") {
                where.razorpayOrderId = null;
            }
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(String(startDate));
            }
            if (endDate) {
                // Ensure endDate includes the full day
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
        console.error("Get Temple Donations Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTempleDonationStats = async (req: Request, res: Response) => {
    try {
        const { templeId } = req.params;

        const stats = await prisma.donation.groupBy({
            by: ['status'],
            where: { templeId: templeId as string },
            _sum: { amount: true },
            _count: { id: true }
        });

        // Calculate online and offline stats
        const onlineStats = await prisma.donation.aggregate({
            where: {
                templeId: templeId as string,
                status: 'SUCCESS',
                razorpayOrderId: { not: null }
            },
            _sum: { amount: true },
            _count: { id: true }
        });

        const offlineStats = await prisma.donation.aggregate({
            where: {
                templeId: templeId as string,
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

        // Get unique donors count (approximate or precise)
        const uniqueDonors = await prisma.donation.groupBy({
            by: ['donorName'],
            where: { templeId: templeId as string, status: 'SUCCESS' }
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
        console.error("Get Temple Donation Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTempleDonation = async (req: Request, res: Response) => {
    try {
        const templeId = String(req.params.templeId || "");
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

        if (!templeId || !amount || !donorName || !donorPhone ) {
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

        if (!validatePincode(pincode)) {
            return res.status(400).json({
                success: false,
                message: "Pin code must be a 6 digit number."
            });
        }

        const temple = await prisma.temple.findUnique({ where: { id: templeId } });
        if (!temple) {
            return res.status(404).json({ success: false, message: "Temple not found" });
        }

        const commissionData = await getCommissionForAmount(
            Number(amount),
            SlabType.GLOBAL,
            undefined,
            CommissionCategory.DONATION,
            true
        );

        const commissionAmount = commissionData.totalCommission || 0;
        const netEarning = Number(amount);
        const displayId = await generateDonationDisplayId();

        // 1️⃣ Find existing DEVOTEE user based on donorPhone, or automatically create a new DEVOTEE user
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
                // Update missing profile info if available
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        name: existingUser.name || donorName,
                        email: existingUser.email || donorEmail || null,
                        address: existingUser.address || address || null
                    }
                });
            } else {
                // Auto-create DEVOTEE user for offline donation
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
                templeId,
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

        // 2️⃣ Create ledger entry for transaction list (if status is SUCCESS)
        if (status === "SUCCESS") {
            const grossAmount = Number(amount) + commissionAmount;
            await prisma.templeLedger.create({
                data: {
                    templeId: templeId,
                    amount: Number(amount),           // Net (temple gets)
                    grossAmount: grossAmount,        // Gross (devotee paid)
                    commission: commissionAmount,    // Platform commission
                    type: "DONATION_EARNING",
                    sourceId: donation.id,
                    description: `Donation from ${donorName || donorPhone} of ₹${amount}`,
                    status: "COMPLETED",
                    createdAt: createdAt ? new Date(createdAt) : undefined,
                }
            });
            console.log(`✅ Ledger entry created for temple donation ${donation.id}`);
        }

        res.status(200).json({ success: true, data: donation, message: "Donation created successfully" });
    } catch (error: any) {
        console.error("Create Temple Donation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendTempleDonationEmail = async (req: Request, res: Response) => {
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

        const localizedTemple = donation.temple ? localize(donation.temple, lang) : null;
        const receiptData = {
            ...donation,
            templeName: localizedTemple?.name || "Dev Bhakti Sacred Offering"
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
        }

        console.error("Email send failed:", emailResult.error);
        return res.status(500).json({ success: false, message: "Failed to send email", error: emailResult.error });
    } catch (error: any) {
        console.error("Send Temple Donation Email Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const downloadDonationsPdf = async (req: Request, res: Response) => {
    try {
        const { templeId } = req.params;
        const { status } = req.query;

        const where: any = { templeId };

        if (status && status !== "all") {
            where.status = status;
        } else if (!status || status === "all") {
            where.status = "SUCCESS";
        }

        const donations = await prisma.donation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { temple: true }
        });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=temple_donations_${new Date().toISOString().slice(0, 10)}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Temple Donations Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Temple: ${getEnglish(donations[0]?.temple?.name) || 'N/A'}`, { align: 'left' });
        doc.text(`Date: ${new Date().toLocaleString()}`, { align: 'left' });
        doc.moveDown();

        // Table Header
        const tableTop = 150;
        const colPositions = [50, 170, 250, 350, 450];

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Donor Name', colPositions[0], tableTop);
        doc.text('Gross', colPositions[1], tableTop);
        doc.text('Comm.', colPositions[2], tableTop);
        doc.text('Net', colPositions[3], tableTop);
        doc.text('Date', colPositions[4], tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Content
        let y = tableTop + 25;
        doc.font('Helvetica');
        donations.forEach((d) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            doc.text(d.isAnonymous ? 'Anonymous' : d.donorName, colPositions[0], y, { width: 110 });
            doc.text(`${d.amount}`, colPositions[1], y);
            doc.text(`${d.commissionAmount || 0}`, colPositions[2], y);
            doc.text(`${d.netEarning || d.amount}`, colPositions[3], y);
            doc.text(new Date(d.createdAt).toLocaleDateString(), colPositions[4], y);
            y += 20;
        });

        doc.end();
    } catch (error: any) {
        console.error("Donations PDF Export Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const downloadDonationsExcel = async (req: Request, res: Response) => {
    try {
        const { templeId } = req.params;
        const { status } = req.query;

        const where: any = { templeId };

        if (status && status !== "all") {
            where.status = status;
        } else if (!status || status === "all") {
            where.status = "SUCCESS";
        }

        const donations = await prisma.donation.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Donations Report');

        worksheet.columns = [
            { header: 'Reference ID', key: 'id', width: 25 },
            { header: 'Donor Name', key: 'donorName', width: 25 },
            { header: 'Email', key: 'donorEmail', width: 25 },
            { header: 'Phone', key: 'donorPhone', width: 15 },
            { header: 'Gross Amount (₹)', key: 'amount', width: 15 },
            { header: 'Commission (₹)', key: 'commissionAmount', width: 15 },
            { header: 'Net Earning (₹)', key: 'netEarning', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Is Anonymous', key: 'isAnonymous', width: 15 },
            { header: 'Date', key: 'createdAt', width: 20 },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF794A05' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        donations.forEach((d) => {
            worksheet.addRow({
                id: d.id,
                donorName: d.isAnonymous ? "Anonymous" : d.donorName,
                donorEmail: d.donorEmail || "N/A",
                donorPhone: d.donorPhone || "N/A",
                amount: d.amount,
                commissionAmount: d.commissionAmount || 0,
                netEarning: d.netEarning || d.amount,
                status: d.status,
                paymentMethod: d.paymentMethod || "N/A",
                isAnonymous: d.isAnonymous ? "Yes" : "No",
                createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString() : "",
            });
        });

        worksheet.columns?.forEach((column) => {
            let maxLength = 0;
            column?.eachCell?.({ includeEmpty: true }, (cell) => {
                const cellLength = cell.value ? cell.value.toString().length : 0;
                if (cellLength > maxLength) maxLength = cellLength;
            });
            if (column) column.width = maxLength < 10 ? 12 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=temple_donations_${new Date().toISOString().slice(0, 10)}.xlsx`);

        return res.status(200).send(buffer);
    } catch (error: any) {
        console.error("Donations Export Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTempleDonation = async (req: Request, res: Response) => {
    try {
        const { templeId, id } = req.params as { templeId?: string; id?: string };

        if (!id) {
            return res.status(400).json({ success: false, message: "Donation id is required" });
        }

        const donation = await prisma.donation.findUnique({ where: { id: id as string } });
        if (!donation) {
            return res.status(404).json({ success: false, message: "Donation not found" });
        }

        // Ensure the donation belongs to the requested temple
        if (templeId && donation.templeId !== templeId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this donation" });
        }

        await prisma.donation.delete({ where: { id: id as string } });

        return res.status(200).json({ success: true, message: "Donation deleted successfully" });
    } catch (error: any) {
        console.error("Delete Temple Donation Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
