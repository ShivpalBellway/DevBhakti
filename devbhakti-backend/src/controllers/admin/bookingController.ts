import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notifyUser } from '../../services/firebaseService';

export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { status, search, startDate, endDate } = req.query;

        let where: any = {};

        if (status && status !== 'all') {
            where.status = status;
        } else {
            // Default: Exclude PENDING bookings unless explicitly requested
            where.status = { not: 'PENDING' };
        }

        if (search) {
            where.OR = [
                { id: { contains: search as string, mode: 'insensitive' } },
                { devoteeName: { contains: search as string, mode: 'insensitive' } },
                { pooja: { name: { contains: search as string, mode: 'insensitive' } } },
                { temple: { name: { contains: search as string, mode: 'insensitive' } } }
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) where.createdAt.lte = new Date(String(endDate));
        }

        const [bookings, total, bookedCount, completedCount, cancelledCount, rejectedCount] = await Promise.all([
            prisma.poojaBooking.findMany({
                where,
                include: {
                    pooja: true,
                    temple: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit,
            }),
            prisma.poojaBooking.count({ where }),
            prisma.poojaBooking.count({ where: { ...where, status: 'BOOKED' } }),
            prisma.poojaBooking.count({ where: { ...where, status: 'COMPLETED' } }),
            prisma.poojaBooking.count({ where: { ...where, status: 'CANCELLED' } }),
            prisma.poojaBooking.count({ where: { ...where, status: 'REJECTED' } }),
        ]);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            stats: {
                booked: bookedCount,
                completed: completedCount,
                cancelled: cancelledCount,
                rejected: rejectedCount
            }
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

export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'BOOKED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const updateData: any = { status };

        // Handle proof photos if status is COMPLETED
        if (status === 'COMPLETED' && req.files && Array.isArray(req.files) && req.files.length > 0) {
            const photoUrls = (req.files as Express.Multer.File[]).map(
                (file) => `${process.env.BASE_URL || ''}/uploads/proofs/${file.filename}`
            );
            updateData.proofPhotos = photoUrls;
        }

        const updatedBooking = await prisma.poojaBooking.update({
            where: { id: id as string },
            data: updateData,
            include: { pooja: true }
        });

        // Sync Ledger Status
        if (status === "COMPLETED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: id as string, type: "POOJA_EARNING" },
                data: { status: "COMPLETED" }
            });
        } else if (status === "CANCELLED" || status === "REJECTED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: id as string, type: "POOJA_EARNING" },
                data: { status: "CANCELLED" }
            });
        }

        // Notify Devotee
        await notifyUser(booking.userId, 'devotee', {
            title: `Pooja Booking ${status === 'COMPLETED' ? 'Completed 🎊' : status === 'CANCELLED' ? 'Cancelled ❌' : status === 'REJECTED' ? 'Rejected ❌' : 'Updated'}`,
            body: `Your booking for ${updatedBooking.pooja.name} has been marked as ${status.toLowerCase()}.`,
            data: { link: '/profile/bookings', bookingId: booking.id }
        });

        res.json({
            success: true,
            message: `Booking status updated to ${status} by admin`,
            data: updatedBooking
        });
    } catch (error) {
        console.error('Error updating booking status by admin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
