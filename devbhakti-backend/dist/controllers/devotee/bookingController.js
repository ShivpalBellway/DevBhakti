"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyBookings = exports.createBooking = void 0;
const prisma_1 = require("../../lib/prisma");
const createBooking = async (req, res) => {
    try {
        const { userId } = req.user;
        const { poojaId, packageName, packagePrice, devoteeName, devoteePhone, devoteeEmail, bookingDate, address, specialRequests } = req.body;
        if (!poojaId || !packageName || !packagePrice || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        // Get pooja to get templeId
        const pooja = await prisma_1.prisma.pooja.findUnique({
            where: { id: poojaId },
            select: { templeId: true }
        });
        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }
        const booking = await prisma_1.prisma.poojaBooking.create({
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
    }
    catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createBooking = createBooking;
const getMyBookings = async (req, res) => {
    try {
        const { userId } = req.user;
        const bookings = await prisma_1.prisma.poojaBooking.findMany({
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
    }
    catch (error) {
        console.error('Error fetching my bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getMyBookings = getMyBookings;
