const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findIds() {
    try {
        const subOrders = await prisma.subOrder.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, shiprocketOrderId: true, status: true }
        });

        console.log('RECENT_SUBORDERS:', JSON.stringify(subOrders, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findIds();
