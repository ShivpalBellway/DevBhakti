"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventsByTemple = exports.getAllEvents = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all events
const getAllEvents = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};
exports.getAllEvents = getAllEvents;
// Get events by temple
const getEventsByTemple = async (req, res) => {
    try {
        const { templeId } = req.params;
        const events = await prisma.event.findMany({
            where: { templeId: String(templeId) },
            orderBy: {
                date: 'asc'
            }
        });
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching temple events:', error);
        res.status(500).json({ error: 'Failed to fetch temple events' });
    }
};
exports.getEventsByTemple = getEventsByTemple;
// Create event
const createEvent = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};
exports.createEvent = createEvent;
// Update event
const updateEvent = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};
exports.updateEvent = updateEvent;
// Delete event
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({
            where: { id: String(id) }
        });
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};
exports.deleteEvent = deleteEvent;
