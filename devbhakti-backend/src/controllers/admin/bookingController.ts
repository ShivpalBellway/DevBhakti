import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const bookings = await prisma.poojaBooking.findMany({
            include: {
                Pooja: true,
                Temple: true,
                User: {
                    select: {
                        name: true,
                        phone: true,
                        email: true
                    }
                }
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
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteBookingByAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.poojaBooking.delete({
            where: { id: id as string }
        });

        res.json({
            success: true,
            message: 'Booking deleted successfully by admin'
        });
    } catch (error) {
        console.error('Error deleting booking by admin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
