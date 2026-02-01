"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBooking = exports.updateBookingStatus = exports.getTempleBookings = void 0;
const prisma_1 = require("../../lib/prisma");
const getTempleBookings = async (req, res) => {
    try {
        const { userId } = req.user;
        // Find temple owned by this user
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        const bookings = await prisma_1.prisma.poojaBooking.findMany({
            where: { templeId: temple.id },
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
    }
    catch (error) {
        console.error('Error fetching temple bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getTempleBookings = getTempleBookings;
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { userId } = req.user;
        if (!['BOOKED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        // Check if booking belongs to a temple owned by this user
        const booking = await prisma_1.prisma.poojaBooking.findUnique({
            where: { id: id },
            include: { temple: true }
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        if (booking.temple.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        const updatedBooking = await prisma_1.prisma.poojaBooking.update({
            where: { id: id },
            data: { status }
        });
        res.json({
            success: true,
            message: `Booking status updated to ${status}`,
            data: updatedBooking
        });
    }
    catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.updateBookingStatus = updateBookingStatus;
const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const booking = await prisma_1.prisma.poojaBooking.findUnique({
            where: { id: id },
            include: { temple: true }
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        if (booking.temple.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        await prisma_1.prisma.poojaBooking.delete({
            where: { id: id }
        });
        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.deleteBooking = deleteBooking;
