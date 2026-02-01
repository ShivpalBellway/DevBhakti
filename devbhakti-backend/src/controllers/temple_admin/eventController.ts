import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getMyEvents = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }

        const events = await prisma.event.findMany({
            where: { templeId: temple.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: events });
    } catch (error: any) {
        console.error('Fetch Events Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMyEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const data = req.body;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }

        const event = await prisma.event.create({
            data: {
                name: data.name,
                date: data.date,
                description: data.description,
                templeId: temple.id,
                status: data.status === false ? false : true
            }
        });

        res.status(201).json({ success: true, data: event });
    } catch (error: any) {
        console.error('Create Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMyEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;
        const data = req.body;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        const existingEvent = await prisma.event.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });

        if (!existingEvent) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: String(id) },
            data: {
                name: data.name,
                date: data.date,
                description: data.description,
                status: data.status !== undefined ? data.status : undefined
            }
        });

        res.json({ success: true, data: updatedEvent });
    } catch (error: any) {
        console.error('Update Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMyEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        const event = await prisma.event.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }

        await prisma.event.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error: any) {
        console.error('Delete Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleEventStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        const event = await prisma.event.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: String(id) },
            data: { status: !event.status }
        });

        res.json({ success: true, data: updatedEvent });
    } catch (error: any) {
        console.error('Toggle Event Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
