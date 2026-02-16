import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStats() {
    try {
        console.log('--- Starting Debug Stats ---');

        console.log('1. Fetching Core Statistics...');
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
            prisma.poojaBooking.aggregate({ _sum: { packagePrice: true } }),
        ]);
        console.log('Core Stats fetched successfully');

        console.log('2. Fetching Order Revenue...');
        const orderRevenue = await prisma.order.aggregate({ _sum: { totalAmount: true } });
        console.log('Order Revenue fetched successfully');

        console.log('3. Fetching Pending Approvals Count...');
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
        console.log('Pending Approvals Count fetched successfully');

        console.log('4. Fetching Recent Activity...');
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
        console.log('Recent Activity fetched successfully');

        console.log('5. Fetching Pending Items List...');
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
        console.log('Pending Items List fetched successfully');

        console.log('--- Debug Stats Finished Successfully ---');
    } catch (error) {
        console.error('--- Error encountered during debug ---');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

debugStats();
