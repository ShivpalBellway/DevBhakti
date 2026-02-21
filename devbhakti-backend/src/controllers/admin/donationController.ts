import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllDonations = async (req: Request, res: Response) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (status && status !== "all") {
            where.status = status;
        } else if (!status || status === "all") {
            // Default to showing only successful donations to avoid cluttering with pending/failed ones
            where.status = "SUCCESS";
        }

        if (search) {
            where.OR = [
                { id: { contains: String(search), mode: 'insensitive' } },
                { donorName: { contains: String(search), mode: 'insensitive' } },
                { temple: { name: { contains: String(search), mode: 'insensitive' } } }
            ];
        }

        const [donations, total] = await Promise.all([
            prisma.donation.findMany({
                where,
                include: { temple: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
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
