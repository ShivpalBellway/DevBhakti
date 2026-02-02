"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability = exports.getMyBookings = exports.createBooking = void 0;
const prisma_1 = require("../../lib/prisma");
const createBooking = async (req, res) => {
    try {
        const { userId } = req.user;
        const { poojaId, packageName, packagePrice, devoteeName, devoteePhone, devoteeEmail, bookingDate, address, specialRequests } = req.body;
        if (!poojaId || !packageName || !packagePrice || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        // Get pooja and temple commission rate
        const pooja = await prisma_1.prisma.pooja.findUnique({
            where: { id: poojaId },
            include: {
                temple: {
                    select: {
                        id: true,
                        poojaCommissionRate: true
                    }
                }
            }
        });
        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }
        const commissionRate = pooja.temple?.poojaCommissionRate || 5.0;
        const commissionAmount = (packagePrice * commissionRate) / 100;
        const netEarning = packagePrice - commissionAmount;
        // --- AVAILABILITY CHECK ---
        // 1. Global Temple Availability
        // We use 'findFirst' because 'poojaId: null' might be tricky with some prisma versions in composite unique constraints if not handled perfectly, 
        // but finding by composite unique key is standard. 
        // Note: Prisma treats null in unique constraint fields differently depending on DB. 
        // For safety/simplicity in this context, we can use findFirst.
        const globalAvailability = await prisma_1.prisma.bookingAvailability.findFirst({
            where: {
                templeId: pooja.templeId,
                poojaId: null,
                date: bookingDate
            }
        });
        if (globalAvailability) {
            if (globalAvailability.isClosed) {
                return res.status(400).json({ success: false, message: 'Bookings are closed for this date.' });
            }
            const totalTempleBookings = await prisma_1.prisma.poojaBooking.count({
                where: {
                    templeId: pooja.templeId,
                    bookingDate: bookingDate,
                    status: { not: 'CANCELLED' }
                }
            });
            if (totalTempleBookings >= globalAvailability.maxBookings) {
                return res.status(400).json({ success: false, message: 'Temple is fully booked for this date.' });
            }
        }
        // 2. Specific Pooja Availability
        const poojaAvailability = await prisma_1.prisma.bookingAvailability.findFirst({
            where: {
                templeId: pooja.templeId,
                poojaId: poojaId,
                date: bookingDate
            }
        });
        if (poojaAvailability) {
            if (poojaAvailability.isClosed) {
                return res.status(400).json({ success: false, message: 'This ritual is unavailable on this date.' });
            }
            const totalPoojaBookings = await prisma_1.prisma.poojaBooking.count({
                where: {
                    poojaId: poojaId,
                    bookingDate: bookingDate,
                    status: { not: 'CANCELLED' }
                }
            });
            if (totalPoojaBookings >= poojaAvailability.maxBookings) {
                return res.status(400).json({ success: false, message: 'Daily limit reached for this ritual.' });
            }
        }
        // --------------------------
        // Create booking and ledger entry in a transaction
        const booking = await prisma_1.prisma.$transaction(async (tx) => {
            const newBooking = await tx.poojaBooking.create({
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
                    status: 'BOOKED',
                    commissionAmount,
                    netEarning
                }
            });
            // Create ledger entry for temple
            await tx.templeLedger.create({
                data: {
                    templeId: pooja.templeId,
                    amount: netEarning,
                    grossAmount: packagePrice,
                    commission: commissionAmount,
                    type: "POOJA_EARNING",
                    sourceId: newBooking.id,
                    description: `Pooja Booking: ${pooja.name} (${packageName})`,
                    status: "PENDING"
                }
            });
            return newBooking;
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
const checkAvailability = async (req, res) => {
    try {
        const { templeId, poojaId, date } = req.query;
        if (!templeId || !date) {
            return res.status(400).json({ success: false, message: 'Temple ID and Date are required' });
        }
        // 1. Global Availability Check
        const globalAvailability = await prisma_1.prisma.bookingAvailability.findFirst({
            where: {
                templeId: templeId,
                poojaId: null,
                date: date
            }
        });
        if (globalAvailability) {
            if (globalAvailability.isClosed) {
                return res.json({
                    success: true,
                    available: false,
                    message: "Bookings are stopped for this date. Please try the next available date."
                });
            }
            const totalTempleBookings = await prisma_1.prisma.poojaBooking.count({
                where: {
                    templeId: templeId,
                    bookingDate: date,
                    status: { not: 'CANCELLED' }
                }
            });
            if (totalTempleBookings >= globalAvailability.maxBookings) {
                return res.json({
                    success: true,
                    available: false,
                    message: "Daily booking limit reached. Please choose another date."
                });
            }
        }
        // 2. Specific Pooja Availability Check (if poojaId provided)
        if (poojaId) {
            const poojaAvailability = await prisma_1.prisma.bookingAvailability.findFirst({
                where: {
                    templeId: templeId,
                    poojaId: poojaId,
                    date: date
                }
            });
            if (poojaAvailability) {
                if (poojaAvailability.isClosed) {
                    return res.json({
                        success: true,
                        available: false,
                        message: "This ritual is unavailable on this date. Please try another day."
                    });
                }
                const totalPoojaBookings = await prisma_1.prisma.poojaBooking.count({
                    where: {
                        poojaId: poojaId,
                        bookingDate: date,
                        status: { not: 'CANCELLED' }
                    }
                });
                if (totalPoojaBookings >= poojaAvailability.maxBookings) {
                    return res.json({
                        success: true,
                        available: false,
                        message: "Slots full for this ritual on selected date. Please choose another date."
                    });
                }
            }
        }
        return res.json({
            success: true,
            available: true,
            message: "Slot available"
        });
    }
    catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.checkAvailability = checkAvailability;
