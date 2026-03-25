import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { sendWhatsAppMessage } from '../../services/whatsappService';

/**
 * Get target devotees based on filters (Birthday, Anniversary, Pooja History)
 */
export const getTargetDevotees = async (req: Request, res: Response) => {
    try {
        const { type, poojaId, startDate, endDate } = req.query;

        let users: any[] = [];

        const today = new Date();
        const todayStr = `-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; // -MM-DD

        if (type === 'birthday') {
            users = await prisma.user.findMany({
                where: {
                    dob: { contains: todayStr }
                },
                select: { id: true, name: true, phone: true, dob: true }
            });
        } else if (type === 'anniversary') {
            users = await prisma.user.findMany({
                where: {
                    anniversary: { contains: todayStr }
                },
                select: { id: true, name: true, phone: true, anniversary: true }
            });
        } else if (type === 'pooja_history') {
            const bookings = await prisma.poojaBooking.findMany({
                where: {
                    poojaId: poojaId as string,
                    createdAt: {
                        gte: startDate ? new Date(String(startDate)) : undefined,
                        lte: endDate ? new Date(String(endDate)) : undefined,
                    },
                    status: 'COMPLETED'
                },
                include: {
                    user: {
                        select: { id: true, name: true, phone: true }
                    }
                }
            });

            // Deduplicate users
            const userMap = new Map();
            bookings.forEach(b => {
                if (b.user) userMap.set(b.user.id, b.user);
            });
            users = Array.from(userMap.values());
        }

        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('Error fetching target devotees:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Send bulk WhatsApp messages to a list of users
 */
export const sendBulkWhatsApp = async (req: Request, res: Response) => {
    try {
        const { userIds, campaignName, templateParams } = req.body;

        if (!userIds || !Array.isArray(userIds) || !campaignName) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { name: true, phone: true }
        });

        const results = [];
        for (const user of users) {
            if (user.phone) {
                try {
                    // Inject user name if required by template
                    const params = templateParams || [];
                    const personalizedParams = params.map((p: string) =>
                        (p === '{{name}}' || p === '"$FirstName"') ? (user.name || 'Bhakt') : p
                    );

                    const result = await sendWhatsAppMessage(
                        user.phone.startsWith('+') ? user.phone : `+91${user.phone}`,
                        user.name || 'Bhakt',
                        campaignName,
                        personalizedParams
                    );
                    results.push({ phone: user.phone, success: true, result });
                } catch (err: any) {
                    results.push({ phone: user.phone, success: false, error: err.message });
                }
            }
        }

        res.json({ success: true, message: `Processed ${results.length} messages`, results });
    } catch (error) {
        console.error('Error sending bulk WhatsApp:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
