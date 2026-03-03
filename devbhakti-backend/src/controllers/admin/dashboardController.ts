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
            prisma.poojaBooking.count({ where: { status: { not: 'PENDING' } } }),
            prisma.order.count(),
            // Reuse logic for revenue
            prisma.poojaBooking.aggregate({
                where: { status: { not: 'PENDING' } },
                _sum: { packagePrice: true }
            }),
        ]);

        const orderRevenue = await prisma.order.aggregate({ _sum: { totalAmount: true } });
        const totalRevenue = (platformSummary._sum.packagePrice || 0) + (orderRevenue._sum.totalAmount || 0);

        // 2. Pending Approvals
        const [pendingTemples, pendingProducts, pendingWithdrawals, pendingPoojas] = await Promise.all([
            prisma.user.count({
                where: {
                    role: 'INSTITUTION',
                    isVerified: false
                }
            }),
            prisma.product.count({ where: { status: 'pending' } }),
            prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
            prisma.pooja.count({ where: { status: false } })
        ]);

        // 3. Recent Activity (Combined)
        const [recentBookings, recentUsers, recentTemples] = await Promise.all([
            prisma.poojaBooking.findMany({
                where: { status: { not: 'PENDING' } },
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
                description: `At ${b.temple?.name || 'Platform'}`,

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

        // 4. Pending Items List for UI - Mixed types
        const [pTemples, pProducts, pWithdrawals, pPoojas] = await Promise.all([
            prisma.temple.findMany({
                where: { user: { role: 'INSTITUTION', isVerified: false } },
                take: 2,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.findMany({
                where: { status: 'pending' },
                take: 2,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.withdrawalRequest.findMany({
                where: { status: 'PENDING' },
                take: 2,
                include: { temple: true, seller: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.pooja.findMany({
                where: { status: false },
                take: 2,
                include: { temple: true },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const pendingApprovalsList = [
            ...pTemples.map(t => ({
                id: t.id,
                name: t.name,
                location: t.location,
                type: 'Temple',
                date: t.createdAt
            })),
            ...pProducts.map(p => ({
                id: p.id,
                name: p.name,
                location: 'Product',
                type: 'Product',
                date: p.createdAt
            })),
            ...pWithdrawals.map(w => ({
                id: w.id,
                name: `₹${w.amount} Withdrawal`,
                location: w.temple?.name || w.seller?.name || 'Seller',
                type: 'Payout',
                date: w.createdAt
            })),
            ...pPoojas.map(p => ({
                id: p.id,
                name: p.name,
                location: p.temple?.name || 'Temple Pooja',
                type: 'Pooja',
                date: p.createdAt
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

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
                    poojas: pendingPoojas,
                    total: pendingTemples + pendingProducts + pendingWithdrawals + pendingPoojas
                },
                activities,
                pendingApprovals: pendingApprovalsList
            }
        });

    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
