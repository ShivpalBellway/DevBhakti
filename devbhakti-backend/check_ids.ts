import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        take: 5,
        select: { id: true, name: true, templeId: true, sellerId: true }
    });
    console.log('Recent Products:', JSON.stringify(products, null, 2));

    const temples = await prisma.temple.findMany({
        take: 5,
        select: { id: true, name: true, userId: true }
    });
    console.log('Recent Temples:', JSON.stringify(temples, null, 2));

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
