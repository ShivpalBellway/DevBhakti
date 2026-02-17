
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        const templeCount = await prisma.temple.count();
        console.log(`Users: ${userCount}`);
        console.log(`Temples: ${templeCount}`);

        const temples = await prisma.temple.findMany({ take: 5 });
        console.log('Sample Temples:', temples.map(t => ({ id: t.id, name: t.name, userId: t.userId })));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
