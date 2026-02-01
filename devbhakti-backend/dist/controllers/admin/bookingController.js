"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookingByAdmin = exports.getAllBookings = void 0;
const prisma_1 = require("../../lib/prisma");
const getAllBookings = async (req, res) => {
    try {
        const bookings = await prisma_1.prisma.poojaBooking.findMany({
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
            }
        });
        res.json({
            success: true,
            data: bookings
        });
    }
    catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getAllBookings = getAllBookings;
const deleteBookingByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.poojaBooking.delete({
            where: { id: id }
        });
        res.json({
            success: true,
            message: 'Booking deleted successfully by admin'
        });
    }
    catch (error) {
        console.error('Error deleting booking by admin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.deleteBookingByAdmin = deleteBookingByAdmin;
