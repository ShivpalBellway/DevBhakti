import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const setMandalAvailability = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner?.ownerId;
        if (!mandalId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Mandal ID missing' });
        }

        const { poojaId, date, maxBookings, isClosed } = req.body;

        if (poojaId) {
            const pooja = await prisma.pooja.findFirst({
                where: { id: poojaId, mandalId: mandalId }
            });
            if (!pooja) {
                return res.status(404).json({ success: false, message: 'Ritual not found' });
            }
        }

        const existingRule = await prisma.bookingAvailability.findFirst({
            where: {
                mandalId: mandalId,
                date: date,
                poojaId: poojaId || null
            }
        });

        let availability;
        if (existingRule) {
            availability = await prisma.bookingAvailability.update({
                where: { id: existingRule.id },
                data: {
                    maxBookings: maxBookings !== undefined ? parseInt(maxBookings) : undefined,
                    isClosed: isClosed !== undefined ? isClosed : undefined
                }
            });
        } else {
            availability = await prisma.bookingAvailability.create({
                data: {
                    mandalId: mandalId,
                    poojaId: poojaId || null,
                    date,
                    maxBookings: maxBookings !== undefined ? parseInt(maxBookings) : 500,
                    isClosed: isClosed || false
                }
            });
        }

        res.json({
            success: true,
            message: 'Availability updated successfully',
            data: availability
        });

    } catch (error) {
        console.error('Error setting mandal availability:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getMandalAvailability = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner?.ownerId;
        if (!mandalId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Mandal ID missing' });
        }

        const { month, year, poojaId } = req.query;

        const whereClause: any = {
            mandalId
        };

        if (month && year) {
            const paddedMonth = month.toString().padStart(2, '0');
            whereClause.date = {
                startsWith: `${year}-${paddedMonth}`
            };
        }

        if (poojaId) {
            whereClause.OR = [
                { poojaId: poojaId as string },
                { poojaId: null }
            ];
        }

        const rules = await prisma.bookingAvailability.findMany({
            where: whereClause
        });

        res.json({
            success: true,
            data: rules
        });

    } catch (error) {
        console.error('Error fetching mandal availability:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
