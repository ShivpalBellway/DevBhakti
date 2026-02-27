import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Check if any staff members exist
    const staffMembers = await prisma.staffMember.findMany({
        select: { id: true, name: true, email: true },
    });
    console.log('\n=== STAFF MEMBERS IN DB ===');
    if (staffMembers.length === 0) {
        console.log('❌ No staff members found in the database!');
    } else {
        staffMembers.forEach(s => console.log(`  - ${s.name} (${s.email}) [${s.id}]`));
    }

    // 2. Check if any admin users exist
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
    });
    console.log('\n=== ADMIN USERS IN DB ===');
    if (admins.length === 0) {
        console.log('❌ No admin users found! notifyAdmins will have nobody to notify.');
    } else {
        admins.forEach(a => console.log(`  - ${a.name} (${a.email}) [${a.id}]`));
    }

    // 3. Check existing notifications
    const notifications = await prisma.notification.findMany({
        where: { userType: 'admin' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, body: true, isRead: true, createdAt: true, userId: true },
    });
    console.log('\n=== RECENT ADMIN NOTIFICATIONS ===');
    if (notifications.length === 0) {
        console.log('No admin notifications found.');
    } else {
        notifications.forEach(n => console.log(`  - [${n.isRead ? 'read' : 'UNREAD'}] ${n.title}: ${n.body?.substring(0, 60)}... (userId: ${n.userId})`));
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
