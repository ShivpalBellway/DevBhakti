import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all events
export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            include: {
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
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
        const { name, date, description, templeId } = req.body;

        if (!name || !date || !templeId) {
            return res.status(400).json({ error: 'Name, date, and temple are required' });
        }

        const event = await prisma.event.create({
            data: {
                name,
                date,
                description: description || null,
                templeId
            },
            include: {
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true
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
        const { name, date, description, templeId } = req.body;

        const event = await prisma.event.update({
            where: { id: String(id) },
            data: {
                name,
                date,
                description,
                templeId
            },
            include: {
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true
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
