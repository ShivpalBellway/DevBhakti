import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import razorpay from '../../lib/razorpay';
import { getEnglish } from '../../utils/localization';
import { generatePhotoDisplayId } from '../../utils/idGenerator';

const PLATFORM_FEE = 25; // Fixed fee: ₹25 as specified (User Pays: Package Price + Platform Fee)

export const createPhotographyBooking = async (req: Request, res: Response) => {
    try {
        const { templeId, packageId, slotId, selectedArea, bookingDate, devoteeName, devoteePhone, devoteeEmail, userId } = req.body;

        if (!templeId || !packageId || !slotId || !selectedArea || !bookingDate || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'Missing required booking details.' });
        }

        // Fetch package & slot
        const pkg = await prisma.photographyPackage.findUnique({ where: { id: packageId } });
        const slot = await prisma.photographySlot.findUnique({ where: { id: slotId } });

        if (!pkg || !pkg.isActive) {
            return res.status(404).json({ success: false, message: 'Photography package not found or inactive.' });
        }
        if (!slot || !slot.isActive) {
            return res.status(404).json({ success: false, message: 'Selected slot not found or inactive.' });
        }

        // Validate booking capacity limit
        const existingCount = await prisma.photographyBooking.count({
            where: {
                slotId,
                bookingDate,
                status: { in: ['BOOKED', 'COMPLETED'] }
            }
        });

        if (existingCount >= slot.maxBookingsPerDay) {
            return res.status(400).json({ success: false, message: 'Selected slot is fully booked for this date.' });
        }

        const packagePrice = pkg.price;
        const totalAmount = packagePrice + PLATFORM_FEE;

        // Generate unique display ID
        const displayId = await generatePhotoDisplayId();

        // Create booking in PENDING state
        const booking = await prisma.photographyBooking.create({
            data: {
                displayId,
                userId: userId || null,
                templeId,
                packageId,
                slotId,
                selectedArea,
                bookingDate,
                timeSlot: slot.slotName,
                packagePrice,
                platformFee: PLATFORM_FEE,
                totalAmount,
                status: 'PENDING'
            }
        });

        // Initialize Razorpay Order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), // convert to paise
            currency: 'INR',
            receipt: booking.id
        });

        res.json({
            success: true,
            data: {
                bookingId: booking.id,
                displayId: booking.displayId,
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmount,
                platformFee: PLATFORM_FEE,
                packagePrice
            }
        });
    } catch (error: any) {
        console.error('Create Photography Booking Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSlotAvailability = async (req: Request, res: Response) => {
    try {
        const { templeId, date } = req.query;

        if (!templeId || !date) {
            return res.status(400).json({ success: false, message: 'templeId and date are required query parameters.' });
        }

        const slots = await prisma.photographySlot.findMany({
            where: { templeId: String(templeId), isActive: true },
            orderBy: { slotName: 'asc' }
        });

        const bookingsCounts = await prisma.photographyBooking.groupBy({
            by: ['slotId'],
            where: {
                templeId: String(templeId),
                bookingDate: String(date),
                status: { in: ['BOOKED', 'COMPLETED'] }
            },
            _count: {
                _all: true
            }
        });

        const countsMap: Record<string, number> = {};
        bookingsCounts.forEach(c => {
            countsMap[c.slotId] = c._count._all;
        });

        const result = slots.map(slot => {
            const booked = countsMap[slot.id] || 0;
            return {
                id: slot.id,
                slotName: slot.slotName,
                maxBookings: slot.maxBookingsPerDay,
                bookedBookings: booked,
                available: booked < slot.maxBookingsPerDay
            };
        });

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
