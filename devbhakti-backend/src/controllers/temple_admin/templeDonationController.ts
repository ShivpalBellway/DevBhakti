import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getTempleDonations = async (req: Request, res: Response) => {
    try {
        const { templeId } = req.params; // Or from auth middleware if applicable
        const { search, status, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = { templeId };

        if (status && status !== "all") {
            where.status = status;
        } else if (!status || status === "all") {
            // Default to showing only successful donations
            where.status = "SUCCESS";
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
                take: Number(limit)
            }),
            prisma.donation.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: donations,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
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

        const result = {
            totalAmount: 0,
            successCount: 0,
            pendingCount: 0,
            failedCount: 0,
            totalDonors: 0
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
        doc.fontSize(12).text(`Temple: ${donations[0]?.temple?.name || 'N/A'}`, { align: 'left' });
        doc.text(`Date: ${new Date().toLocaleString()}`, { align: 'left' });
        doc.moveDown();

        // Table Header
        const tableTop = 150;
        const colPositions = [50, 170, 250, 350, 450];

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Donor Name', colPositions[0], tableTop);
        doc.text('Amount', colPositions[1], tableTop);
        doc.text('Method', colPositions[2], tableTop);
        doc.text('Date', colPositions[3], tableTop);
        doc.text('Ref ID', colPositions[4], tableTop);

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
            doc.text(`Rs. ${d.amount}`, colPositions[1], y);
            doc.text(d.paymentMethod || 'N/A', colPositions[2], y);
            doc.text(new Date(d.createdAt).toLocaleDateString(), colPositions[3], y);
            doc.text(d.id.slice(-6).toUpperCase(), colPositions[4], y);
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
            { header: 'Amount (₹)', key: 'amount', width: 15 },
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
