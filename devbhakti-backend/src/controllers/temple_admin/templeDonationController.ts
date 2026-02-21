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
