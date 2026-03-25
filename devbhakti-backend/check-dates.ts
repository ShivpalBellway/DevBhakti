import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, dob: true, anniversary: true }
    });
    console.log('User Dates:', JSON.stringify(users, null, 2));
    process.exit(0);
}

check();
