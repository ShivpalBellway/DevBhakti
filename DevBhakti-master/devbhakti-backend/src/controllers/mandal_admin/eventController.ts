import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildLangJson, getLang, localize } from '../../utils/localization';

export const getMyEvents = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;

        const events = await prisma.event.findMany({
            where: { mandalId },
            orderBy: { createdAt: 'desc' }
        });

        const lang = getLang(req);
        res.json({ success: true, data: localize(events, lang) });
    } catch (error: any) {
        console.error('Fetch Mandal Events Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMyEvent = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const data = req.body;

        const event = await prisma.event.create({
            data: {
                name: buildLangJson(data.name || data.name_en, data.name_hi, data.name_mr),
                description: buildLangJson(data.description_en || data.description || '', data.description_hi, data.description_mr),
                date: data.date,
                time: data.time || null,
                mandalId,
                status: data.status === false ? false : true,
                mandalSpecificData: data.mandalSpecificData || null
            }
        });

        const lang = getLang(req);
        res.status(201).json({ success: true, data: localize(event, lang) });
    } catch (error: any) {
        console.error('Create Mandal Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMyEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const mandalId = (req as any).owner.ownerId;
        const data = req.body;

        const existingEvent = await prisma.event.findFirst({ where: { id: String(id), mandalId } });
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: String(id) },
            data: {
                name: buildLangJson(data.name_en || data.name, data.name_hi, data.name_mr),
                description: buildLangJson(data.description_en || data.description, data.description_hi, data.description_mr),
                date: data.date,
                time: data.time !== undefined ? data.time : undefined,
                status: data.status !== undefined ? data.status : undefined,
                mandalSpecificData: data.mandalSpecificData !== undefined ? data.mandalSpecificData : undefined
            }
        });

        res.json({ success: true, data: updatedEvent });
    } catch (error: any) {
        console.error('Update Mandal Event Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMyEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const mandalId = (req as any).owner.ownerId;
        const event = await prisma.event.findFirst({ where: { id: String(id), mandalId } });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }
        await prisma.event.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleEventStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const mandalId = (req as any).owner.ownerId;
        const event = await prisma.event.findFirst({ where: { id: String(id), mandalId } });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }
        const updatedEvent = await prisma.event.update({
            where: { id: String(id) },
            data: { status: !event.status }
        });
        res.json({ success: true, data: updatedEvent });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createBulkEvents = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const { events } = req.body;

        if (!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ success: false, message: "Payload must be a non-empty 'events' array." });
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < events.length; i++) {
            const eventData = events[i];
            try {
                if (!eventData.name_en && !eventData.name) throw new Error("Name is required");
                if (!eventData.date) throw new Error("Date is required");

                const recommendedPoojaIds = eventData.recommendedPoojaIds;

                await prisma.event.create({
                    data: {
                        name: buildLangJson(eventData.name_en || eventData.name, eventData.name_hi, eventData.name_mr),
                        description: buildLangJson(eventData.description_en || eventData.description || '', eventData.description_hi, eventData.description_mr),
                        date: eventData.date,
                        time: eventData.time || null,
                        mandalId,
                        status: eventData.status === false ? false : true,
                        // events don't have Pooja references mapped on Mandal level in exactly the same way, or maybe they do?
                        ...(recommendedPoojaIds && recommendedPoojaIds.length > 0
                            ? { Pooja: { connect: recommendedPoojaIds.map((id: string) => ({ id })) } }
                            : {})
                    }
                });
                successCount++;
            } catch (err: any) {
                failCount++;
                errors.push(`Row ${i + 2}: ${err.message}`);
            }
        }

        res.status(201).json({
            success: true,
            data: { successCount, failCount, errors }
        });
    } catch (error: any) {
        console.error('Create Bulk Events Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

