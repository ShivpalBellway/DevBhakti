import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export const getAllDonations = async (req: Request, res: Response) => {
    try {
        const { search, status, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};

        // Status Filtering
        if (status && status !== "all") {
            where.status = status;
        } else if (!status) {
            // Default behavior if no status provided
            where.status = "SUCCESS";
        }

        // Search across multiple fields
        if (search) {
            where.OR = [
                { id: { contains: String(search), mode: 'insensitive' } },
                { displayId: { contains: String(search), mode: 'insensitive' } },
                { donorName: { contains: String(search), mode: 'insensitive' } },
                { userId: { contains: String(search), mode: 'insensitive' } },
                { temple: { name: { contains: String(search), mode: 'insensitive' } } }
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
                include: { temple: { select: { name: true } } },
                orderBy: { [String(sortBy)]: sortOrder as any },
                skip,
                take: Number(limit)
            }),
            prisma.donation.count({ where })
        ]);

        const formattedDonations = donations.map(d => ({
            id: d.id,
            donorName: d.donorName,
            donorPhone: d.donorPhone,
            donorEmail: d.donorEmail,
            templeName: d.temple.name,
            amount: d.amount,
            status: d.status,
            createdAt: d.createdAt,
            isAnonymous: d.isAnonymous,
            is80GRequired: d.is80GRequired,
            panNumber: d.panNumber,
            address: d.address,
            message: d.message,
            displayId: d.displayId,
            paymentMethod: d.paymentMethod

        }));

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





// Helper function to safely escape CSV values (handles commas and quotes)
const escapeCSV = (str: any) => {
    if (str === null || str === undefined) return '';
    return `"${String(str).replace(/"/g, '""')}"`;
};

export const downloadDonationsExcel = async (req: Request, res: Response) => {
    try {
        console.log("Starting Excel Export...");

        // 1. Database se data layein
        const donations = await prisma.donation.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                donorName: true,
                donorEmail: true,
                donorPhone: true,
                amount: true,
                status: true,
                paymentMethod: true,
                // templeName: true,
                createdAt: true,
                panNumber: true,
                address: true,
                message: true,
                isAnonymous: true
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
            { header: 'Amount', key: 'amount', width: 15 },
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
            worksheet.addRow({
                id: d.id,
                donorName: d.donorName,
                donorEmail: d.donorEmail,
                donorPhone: d.donorPhone,
                templeName: d.templeName,
                amount: d.amount,
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