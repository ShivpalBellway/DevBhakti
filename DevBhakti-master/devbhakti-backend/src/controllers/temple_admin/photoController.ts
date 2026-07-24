import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildLangJson, getLang, localize } from '../../utils/localization';

export const getPhotographySettings = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const temple = await prisma.temple.findUnique({
            where: { id: templeId },
            select: {
                photographyEnabled: true,
                allowedPhotoAreas: true,
                photographyRules: true
            }
        });
        res.json({ success: true, data: temple });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePhotographySettings = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const { enabled, isEnabled, allowedAreas, rules } = req.body;

        const updated = await prisma.temple.update({
            where: { id: templeId },
            data: {
                photographyEnabled: isEnabled !== undefined ? !!isEnabled : !!enabled,
                allowedPhotoAreas: allowedAreas || null,
                photographyRules: rules || null
            }
        });

        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Package management
export const getMyPackages = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const packages = await prisma.photographyPackage.findMany({
            where: { templeId },
            orderBy: { createdAt: 'desc' }
        });
        const lang = getLang(req);
        res.json({ success: true, data: localize(packages, lang) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMyPackage = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const { name, name_en, name_hi, name_mr, description, price, duration } = req.body;

        const pkgName = buildLangJson(name || name_en, name_hi, name_mr);
        const pkgDesc = description ? buildLangJson(description, description, description) : (buildLangJson('', '', '') as any);
        const parsedDuration = parseInt(String(duration).replace(/\D/g, ''), 10) || 60;

        const pkg = await prisma.photographyPackage.create({
            data: {
                templeId,
                name: pkgName,
                description: pkgDesc,
                price: parseFloat(price),
                duration: parsedDuration
            }
        });
        res.status(201).json({ success: true, data: pkg });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMyPackage = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const id = req.params.id as string;
        const { name, name_en, name_hi, name_mr, description, price, duration, isActive } = req.body;

        const pkgName = buildLangJson(name || name_en, name_hi, name_mr);
        const pkgDesc = description ? buildLangJson(description, description, description) : (buildLangJson('', '', '') as any);
        const parsedDuration = parseInt(String(duration).replace(/\D/g, ''), 10) || 60;

        const pkg = await prisma.photographyPackage.updateMany({
            where: { id, templeId },
            data: {
                name: pkgName,
                description: pkgDesc,
                price: parseFloat(price),
                duration: parsedDuration,
                isActive: isActive === undefined ? true : !!isActive
            }
        });

        res.json({ success: true, data: pkg });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMyPackage = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const id = req.params.id as string;

        await prisma.photographyPackage.deleteMany({
            where: { id, templeId }
        });
        res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Slots management
export const getMySlots = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const slots = await prisma.photographySlot.findMany({
            where: { templeId },
            orderBy: { slotName: 'asc' }
        });
        res.json({ success: true, data: slots });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMySlot = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const { slotName, startTime, endTime, maxBookingsPerDay, maxCapacity } = req.body;

        const finalSlotName = slotName || (startTime && endTime ? `${startTime} - ${endTime}` : '09:00 AM - 10:00 AM');
        const capacity = parseInt(maxBookingsPerDay || maxCapacity, 10) || 10;

        const slot = await prisma.photographySlot.create({
            data: {
                templeId,
                slotName: finalSlotName,
                maxBookingsPerDay: capacity
            }
        });
        res.status(201).json({ success: true, data: slot });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMySlot = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const id = req.params.id as string;
        const { slotName, startTime, endTime, maxBookingsPerDay, maxCapacity, isActive } = req.body;

        const finalSlotName = slotName || (startTime && endTime ? `${startTime} - ${endTime}` : '09:00 AM - 10:00 AM');
        const capacity = parseInt(maxBookingsPerDay || maxCapacity, 10) || 10;

        const slot = await prisma.photographySlot.updateMany({
            where: { id, templeId },
            data: {
                slotName: finalSlotName,
                maxBookingsPerDay: capacity,
                isActive: isActive === undefined ? true : !!isActive
            }
        });

        res.json({ success: true, data: slot });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMySlot = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const id = req.params.id as string;

        await prisma.photographySlot.deleteMany({
            where: { id, templeId }
        });
        res.json({ success: true, message: 'Slot deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bookings lists
export const getMyBookings = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const bookings = await prisma.photographyBooking.findMany({
            where: { templeId },
            include: {
                package: true,
                slot: true,
                user: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: bookings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Ticket Verification scanner endpoint
export const verifyPhotographyTicket = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const { ticketId } = req.body;

        const booking = await prisma.photographyBooking.findFirst({
            where: { displayId: ticketId, templeId }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Ticket not found for this temple.' });
        }

        if (booking.status === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Ticket already verified and completed.' });
        }

        if (booking.status !== 'BOOKED') {
            return res.status(400).json({ success: false, message: `Ticket is not in active state (Current: ${booking.status})` });
        }

        const updated = await prisma.photographyBooking.update({
            where: { id: booking.id },
            data: { status: 'COMPLETED' }
        });

        res.json({ success: true, message: 'Ticket verified successfully. Entry Allowed.', data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
