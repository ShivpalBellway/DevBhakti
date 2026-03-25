import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all events
export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search as string;

        let where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { temple: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                include: {
                    temple: {
                        select: {
                            id: true,
                            name: true,
                            location: true
                        }
                    },
                    Pooja: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            duration: true,
                            image: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.event.count({ where })
        ]);

        res.json({
            success: true,
            data: events,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch events' });
    }
};

// Get events by temple
export const getEventsByTemple = async (req: Request, res: Response) => {
    try {
        const { templeId } = req.params;
        const events = await prisma.event.findMany({
            where: { templeId: String(templeId) },
            orderBy: {
                date: 'asc'
            }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching temple events:', error);
        res.status(500).json({ error: 'Failed to fetch temple events' });
    }
};

// Create event
export const createEvent = async (req: Request, res: Response) => {
    try {
        const { name, date, time, description, templeId, recommendedPoojaIds } = req.body;

        if (!name || !date) {
            return res.status(400).json({ error: 'Name and date are required' });
        }

        const event = await prisma.event.create({
            data: {
                name,
                date,
                time: time || null,
                description: description || null,
                templeId: templeId || null,
                // Connect recommended poojas if provided
                ...(recommendedPoojaIds && recommendedPoojaIds.length > 0
                    ? {
                        Pooja: {
                            connect: recommendedPoojaIds.map((id: string) => ({ id }))
                        }
                    }
                    : {})
            },
            include: {
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true
                    }
                },
                Pooja: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        duration: true,
                        image: true
                    }
                }
            }
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// Update event
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, date, time, description, templeId, recommendedPoojaIds } = req.body;

        const event = await prisma.event.update({
            where: { id: String(id) },
            data: {
                name,
                date,
                time: time !== undefined ? time : undefined,
                description,
                status: req.body.status !== undefined ? req.body.status : undefined,
                templeId: templeId || null,
                // Sync recommended poojas if provided
                ...(recommendedPoojaIds !== undefined
                    ? {
                        Pooja: {
                            set: recommendedPoojaIds.map((poojaId: string) => ({ id: poojaId }))
                        }
                    }
                    : {})
            },
            include: {
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true
                    }
                },
                Pooja: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        duration: true,
                        image: true
                    }
                }
            }
        });

        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.event.delete({
            where: { id: String(id) }
        });

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// Toggle event status
export const toggleEventStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const event = await prisma.event.update({
            where: { id: String(id) },
            data: { status }
        });

        res.json({ success: true, message: `Event ${status ? 'activated' : 'deactivated'} successfully`, data: event });
    } catch (error) {
        console.error('Error toggling event status:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle event status' });
    }
};
