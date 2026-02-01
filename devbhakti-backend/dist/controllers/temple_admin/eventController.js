"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleEventStatus = exports.deleteMyEvent = exports.updateMyEvent = exports.createMyEvent = exports.getMyEvents = void 0;
const prisma_1 = require("../../lib/prisma");
const getMyEvents = async (req, res) => {
    try {
        const userId = req.user.userId;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        const events = await prisma_1.prisma.event.findMany({
            where: { templeId: temple.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: events });
    }
    catch (error) {
        console.error('Fetch Events Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyEvents = getMyEvents;
const createMyEvent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = req.body;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        const event = await prisma_1.prisma.event.create({
            data: {
                name: data.name,
                date: data.date,
                description: data.description,
                templeId: temple.id,
                status: data.status === false ? false : true
            }
        });
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        console.error('Create Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createMyEvent = createMyEvent;
const updateMyEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const data = req.body;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        const existingEvent = await prisma_1.prisma.event.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }
        const updatedEvent = await prisma_1.prisma.event.update({
            where: { id: String(id) },
            data: {
                name: data.name,
                date: data.date,
                description: data.description,
                status: data.status !== undefined ? data.status : undefined
            }
        });
        res.json({ success: true, data: updatedEvent });
    }
    catch (error) {
        console.error('Update Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateMyEvent = updateMyEvent;
const deleteMyEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        const event = await prisma_1.prisma.event.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }
        await prisma_1.prisma.event.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Delete Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteMyEvent = deleteMyEvent;
const toggleEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        const event = await prisma_1.prisma.event.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }
        const updatedEvent = await prisma_1.prisma.event.update({
            where: { id: String(id) },
            data: { status: !event.status }
        });
        res.json({ success: true, data: updatedEvent });
    }
    catch (error) {
        console.error('Toggle Event Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleEventStatus = toggleEventStatus;
