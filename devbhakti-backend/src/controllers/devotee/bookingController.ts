import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const createBooking = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const {
            poojaId,
            packageName,
            packagePrice,
            devoteeName,
            devoteePhone,
            devoteeEmail,
            bookingDate,
            address,
            specialRequests
        } = req.body;

        if (!poojaId || !packageName || !packagePrice || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Get pooja to get templeId
        const pooja = await prisma.pooja.findUnique({
            where: { id: poojaId },
            select: { templeId: true }
        });

        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }

        const booking = await prisma.poojaBooking.create({
            data: {
                userId,
                poojaId,
                templeId: pooja.templeId,
                packageName,
                packagePrice,
                devoteeName,
                devoteePhone,
                devoteeEmail,
                bookingDate,
                address,
                specialRequests,
                status: 'BOOKED'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Pooja booked successfully',
            data: booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getMyBookings = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;

        const bookings = await prisma.poojaBooking.findMany({
            where: { userId },
            include: {
                pooja: true,
                temple: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching my bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
