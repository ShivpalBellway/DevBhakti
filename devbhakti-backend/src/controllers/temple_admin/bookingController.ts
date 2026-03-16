import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notifyUser } from '../../services/firebaseService';

export const getTempleBookings = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const { status, poojaId, search, startDate, endDate } = req.query;

        const where: any = {
            templeId,
            status: { not: 'PENDING' }
        };

        // Filter by Status
        if (status) {
            where.status = status;
        }

        // Filter by Pooja
        if (poojaId) {
            where.poojaId = poojaId;
        }

        // Filter by Search (Devotee Name or Phone)
        if (search) {
            where.OR = [
                { devoteeName: { contains: search as string, mode: 'insensitive' } },
                { devoteePhone: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        // Filter by Date Range (Created At)
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const bookings = await prisma.poojaBooking.findMany({
            where,
            include: {
                pooja: true,
                user: {
                    select: {
                        name: true,
                        phone: true,
                        profileImage: true
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
        console.error('Error fetching temple bookings:', error);
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

        // Check if booking belongs to a temple owned by this user
        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string },
            include: { temple: true }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (!booking.temple || booking.temple.id !== (req as any).owner.ownerId) {

            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updateData: any = { status };

        // Handle proof photos if status is COMPLETED
        if (status === 'COMPLETED' && req.files && Array.isArray(req.files)) {
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
            message: `Booking status updated to ${status}`,
            data: updatedBooking
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string },
            include: { temple: true }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (!booking.temple || booking.temple.id !== (req as any).owner.ownerId) {

            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await prisma.poojaBooking.delete({
            where: { id: id as string }
        });

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
