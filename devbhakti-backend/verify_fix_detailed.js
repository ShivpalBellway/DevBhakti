const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const temples = await prisma.temple.findMany({
        include: {
            user: {
                select: {
                    isVerified: true
                }
            }
        }
    });

    console.log('--- Temple Status Report ---');
    temples.forEach(t => {
        console.log(`Temple: ${t.name}`);
        console.log(`  isActive: ${t.isActive}`);
        console.log(`  isLive: ${t.isLive}`);
        console.log(`  liveStatus: ${t.liveStatus}`);
        console.log(`  isVerified: ${t.user?.isVerified}`);
        console.log('---------------------------');
    });

    const wouldShowBefore = temples.filter(t => t.isActive && t.isLive && t.user?.isVerified).length;
    const willShowNow = temples.filter(t => t.isActive && t.user?.isVerified).length;

    console.log(`Total temples in DB: ${temples.length}`);
    console.log(`Temples showing BEFORE fix: ${wouldShowBefore}`);
    console.log(`Temples showing AFTER fix: ${willShowNow}`);

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
