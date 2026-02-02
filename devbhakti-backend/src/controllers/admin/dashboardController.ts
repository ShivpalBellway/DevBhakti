import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Core Statistics
        const [
            totalTemples,
            totalUsers,
            totalPoojaBookings,
            totalProductOrders,
            platformSummary
        ] = await Promise.all([
            prisma.temple.count(),
            prisma.user.count({ where: { role: 'DEVOTEE' } }),
            prisma.poojaBooking.count(),
            prisma.order.count(),
            // Reuse logic for revenue
            prisma.poojaBooking.aggregate({ _sum: { packagePrice: true } }),
        ]);

        const orderRevenue = await prisma.order.aggregate({ _sum: { totalAmount: true } });
        const totalRevenue = (platformSummary._sum.packagePrice || 0) + (orderRevenue._sum.totalAmount || 0);

        // 2. Pending Approvals
        const [pendingTemples, pendingProducts, pendingWithdrawals] = await Promise.all([
            prisma.user.count({
                where: {
                    role: 'INSTITUTION',
                    isVerified: false
                }
            }),
            prisma.product.count({ where: { status: 'pending' } }),
            prisma.withdrawalRequest.count({ where: { status: 'PENDING' } })
        ]);

        // 3. Recent Activity (Combined)
        const [recentBookings, recentUsers, recentTemples] = await Promise.all([
            prisma.poojaBooking.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { pooja: true, temple: true }
            }),
            prisma.user.findMany({
                take: 5,
                where: { role: 'DEVOTEE' },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.temple.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // Format activities
        const activities: any[] = [
            ...recentBookings.map(b => ({
                id: b.id,
                type: 'booking',
                title: `New booking for ${b.pooja.name}`,
                description: `At ${b.temple.name}`,
                time: b.createdAt
            })),
            ...recentUsers.map(u => ({
                id: u.id,
                type: 'user',
                title: `New user registration`,
                description: u.name || u.phone || 'Anonymous',
                time: u.createdAt
            })),
            ...recentTemples.map(t => ({
                id: t.id,
                type: 'temple',
                title: `New temple registered`,
                description: t.name,
                time: t.createdAt
            }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

        // 4. Pending Items List for UI
        const pendingItems = await prisma.temple.findMany({
            where: { user: { role: 'INSTITUTION', isVerified: false } },
            take: 5,
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: {
                stats: {
                    totalTemples,
                    totalUsers,
                    totalBookings: totalPoojaBookings + totalProductOrders,
                    totalRevenue
                },
                pending: {
                    temples: pendingTemples,
                    products: pendingProducts,
                    withdrawals: pendingWithdrawals,
                    total: pendingTemples + pendingProducts + pendingWithdrawals
                },
                activities,
                pendingApprovals: pendingItems.map(t => ({
                    id: t.id,
                    name: t.name,
                    location: t.location,
                    type: 'Temple',
                    date: t.createdAt
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
