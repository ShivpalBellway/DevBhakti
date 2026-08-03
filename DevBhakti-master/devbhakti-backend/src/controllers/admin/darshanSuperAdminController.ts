import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { DarshanTicketStatus } from '@prisma/client';
import { getEnglish } from '../../utils/localization';

// Get all darshan tickets across all temples
export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const { date, status, templeId, search, page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};

        if (date) {
            query.slot = { date: String(date) };
        }
        if (status) {
            query.status = status as DarshanTicketStatus;
        }
        if (templeId) {
            query.templeId = String(templeId);
        }
        if (search) {
            const searchStr = String(search);
            query.OR = [
                { displayId: { contains: searchStr, mode: 'insensitive' } },
                { visitorName: { contains: searchStr, mode: 'insensitive' } },
                { visitorPhone: { contains: searchStr } }
            ];
        }

        const [tickets, total] = await Promise.all([
            prisma.darshanTicket.findMany({
                where: query,
                include: {
                    slot: true,
                    temple: {
                        select: { name: true }
                    },
                    user: {
                        select: { name: true, phone: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.darshanTicket.count({ where: query })
        ]);

        // Localize temple names
        const localizedTickets = tickets.map(ticket => ({
            ...ticket,
            temple: {
                ...ticket.temple,
                name: getEnglish(ticket.temple.name)
            }
        }));

        res.json({
            tickets: localizedTickets,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error('Error fetching all darshan tickets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get aggregated darshan stats
export const getDarshanStats = async (req: Request, res: Response) => {
    try {
        const { templeId } = req.query;

        const baseQuery: any = {};
        if (templeId) baseQuery.templeId = String(templeId);

        const [
            totalTickets,
            confirmedTickets,
            usedTickets,
            pendingTickets,
            expiredTickets,
            revenueAgg,
            commissionAgg,
            todayTickets,
            activeTemples
        ] = await Promise.all([
            prisma.darshanTicket.count({ where: baseQuery }),
            prisma.darshanTicket.count({ where: { ...baseQuery, status: 'CONFIRMED' } }),
            prisma.darshanTicket.count({ where: { ...baseQuery, status: 'USED' } }),
            prisma.darshanTicket.count({ where: { ...baseQuery, status: 'PENDING' } }),
            prisma.darshanTicket.count({ where: { ...baseQuery, status: 'EXPIRED' } }),
            prisma.darshanTicket.aggregate({
                where: { ...baseQuery, status: { in: ['CONFIRMED', 'USED'] } },
                _sum: { totalAmount: true }
            }),
            prisma.darshanTicket.aggregate({
                where: { ...baseQuery, status: { in: ['CONFIRMED', 'USED'] } },
                _sum: { commissionAmount: true, platformFee: true }
            }),
            prisma.darshanTicket.count({
                where: {
                    ...baseQuery,
                    createdAt: {
                        gte: new Date(new Date().toISOString().split('T')[0])
                    }
                }
            }),
            prisma.temple.count({ where: { isDarshanActive: true } })
        ]);

        // Total visitors (sum of visitorCount for confirmed + used tickets)
        const totalVisitorsAgg = await prisma.darshanTicket.aggregate({
            where: { ...baseQuery, status: { in: ['CONFIRMED', 'USED'] } },
            _sum: { visitorCount: true }
        });

        // Slot utilization — average bookedCount / maxCapacity across active slots
        const today = new Date().toISOString().split('T')[0];
        const activeSlots = await prisma.darshanSlot.findMany({
            where: {
                ...(templeId ? { templeId: String(templeId) } : {}),
                date: { gte: today },
                isClosed: false
            },
            select: { maxCapacity: true, bookedCount: true }
        });

        const totalCapacity = activeSlots.reduce((sum, s) => sum + s.maxCapacity, 0);
        const totalBooked = activeSlots.reduce((sum, s) => sum + s.bookedCount, 0);
        const utilizationPercent = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

        res.json({
            totalTickets,
            confirmedTickets,
            usedTickets,
            pendingTickets,
            expiredTickets,
            todayTickets,
            totalVisitors: totalVisitorsAgg._sum.visitorCount || 0,
            totalRevenue: revenueAgg._sum.totalAmount || 0,
            totalCommission: (commissionAgg._sum.commissionAmount || 0) + (commissionAgg._sum.platformFee || 0),
            activeTemples,
            slotUtilization: utilizationPercent,
            activeSlotsCount: activeSlots.length
        });
    } catch (error) {
        console.error('Error fetching darshan stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
