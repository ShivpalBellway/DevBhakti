const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNotificationLinks() {
    try {
        console.log("Checking for broken notification links...");

        // Find notifications with the broken admin dashboard orders link format
        const brokenAdminLinks = await prisma.notification.findMany({
            where: {
                data: {
                    path: ['link'],
                    string_contains: '/admin/dashboard/orders/'
                }
            }
        });

        console.log(`Found ${brokenAdminLinks.length} broken admin links.`);

        let updateCount = 0;
        for (const notif of brokenAdminLinks) {
            const data = notif.data;
            if (data && typeof data === 'object' && data.link && data.link.includes('/admin/dashboard/orders/')) {
                // Extract the order ID from the old broken link
                const parts = data.link.split('/admin/dashboard/orders/');
                if (parts.length > 1) {
                    const orderId = parts[1];
                    const fixedLink = `/admin/products/orders?id=${orderId}`;

                    data.link = fixedLink;

                    await prisma.notification.update({
                        where: { id: notif.id },
                        data: { data }
                    });
                    updateCount++;
                }
            }
        }

        console.log(`Fixed ${updateCount} admin notification links successfully.`);

    } catch (error) {
        console.error("Error fixing links:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixNotificationLinks();
