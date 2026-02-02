"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = exports.setAvailability = void 0;
const prisma_1 = require("../../lib/prisma");
const setAvailability = async (req, res) => {
    try {
        const { userId } = req.user;
        const { poojaId, date, maxBookings, isClosed } = req.body;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }
        // Verify temple ownership
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        // Validate pooja ownership if poojaId is provided
        if (poojaId) {
            const pooja = await prisma_1.prisma.pooja.findFirst({
                where: { id: poojaId, templeId: temple.id }
            });
            if (!pooja) {
                return res.status(404).json({ success: false, message: 'Ritual not found' });
            }
        }
        // Upsert Availability
        // Note: Using upsert with composite unique key involving nullable fields can be tricky.
        // We will try manual find-then-update/create to be safe or use upsert if we are confident in the key.
        // The composite key is [templeId, poojaId, date]
        // Manual Find-then-Update/Create to avoid Prisma/DB issues with nullable fields in composite unique constraints
        const existingRule = await prisma_1.prisma.bookingAvailability.findFirst({
            where: {
                templeId: temple.id,
                date: date,
                poojaId: poojaId || null
            }
        });
        let availability;
        if (existingRule) {
            availability = await prisma_1.prisma.bookingAvailability.update({
                where: { id: existingRule.id },
                data: {
                    maxBookings: maxBookings !== undefined ? parseInt(maxBookings) : undefined,
                    isClosed: isClosed !== undefined ? isClosed : undefined
                }
            });
        }
        else {
            availability = await prisma_1.prisma.bookingAvailability.create({
                data: {
                    templeId: temple.id,
                    poojaId: poojaId || null,
                    date,
                    maxBookings: maxBookings !== undefined ? parseInt(maxBookings) : 20,
                    isClosed: isClosed || false
                }
            });
        }
        res.json({
            success: true,
            message: 'Availability updated successfully',
            data: availability
        });
    }
    catch (error) {
        console.error('Error setting availability:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.setAvailability = setAvailability;
const getAvailability = async (req, res) => {
    try {
        const { userId } = req.user;
        const { month, year, poojaId } = req.query;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        const whereClause = {
            templeId: temple.id
        };
        // Filter by month/year if provided (assuming date string YYYY-MM-DD)
        if (month && year) {
            // Simple string matching for YYYY-MM prefix
            const paddedMonth = month.toString().padStart(2, '0');
            whereClause.date = {
                startsWith: `${year}-${paddedMonth}`
            };
        }
        if (poojaId) {
            whereClause.poojaId = poojaId;
        }
        else {
            // If fetching global availability, explicit null check or just return all?
            // Usually valid to return all rules for the temple (both global and specific)
        }
        const rules = await prisma_1.prisma.bookingAvailability.findMany({
            where: whereClause
        });
        res.json({
            success: true,
            data: rules
        });
    }
    catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getAvailability = getAvailability;
