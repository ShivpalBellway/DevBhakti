import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { dob: { contains: '/' } },
                { anniversary: { contains: '/' } }
            ]
        }
    });

    console.log(`Found ${users.length} users to migrate.`);

    for (const user of users) {
        let newDob = user.dob;
        let newAnn = user.anniversary;

        if (user.dob && user.dob.includes('/')) {
            const [d, m, y] = user.dob.split('/');
            if (d && m && y) {
                newDob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }

        if (user.anniversary && user.anniversary.includes('/')) {
            const [d, m, y] = user.anniversary.split('/');
            if (d && m && y) {
                newAnn = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }

        if (newDob !== user.dob || newAnn !== user.anniversary) {
            await prisma.user.update({
                where: { id: user.id },
                data: { dob: newDob, anniversary: newAnn }
            });
            console.log(`Migrated user ${user.id}: ${user.dob} -> ${newDob}, ${user.anniversary} -> ${newAnn}`);
        }
    }

    console.log('Migration completed.');
    process.exit(0);
}

migrate();
