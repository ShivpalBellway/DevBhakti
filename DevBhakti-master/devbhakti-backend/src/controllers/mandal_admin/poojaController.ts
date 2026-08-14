import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildLangJson, buildLangArray, getLang, localize } from '../../utils/localization';

const safeParse = (val: any, fallback: any = null) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return fallback; }
};

export const getMandalPoojas = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const poojas = await prisma.pooja.findMany({
            where: { mandalId },
            orderBy: { createdAt: 'desc' }
        });
        const lang = getLang(req);
        res.json({ success: true, data: localize(poojas, lang) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMandalPooja = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const file = req.file;
        const data = req.body;

        const pooja = await prisma.pooja.create({
            data: {
                name: buildLangJson(data.name_en || data.name, data.name_hi, data.name_mr),
                category: buildLangJson(data.category_en || data.category, data.category_hi, data.category_mr),
                duration: buildLangJson(data.duration_en || data.duration || 'N/A', data.duration_hi, data.duration_mr),
                about: buildLangJson(data.about_en || data.about, data.about_hi, data.about_mr),
                process: buildLangJson(data.process_en || data.process, data.process_hi, data.process_mr),
                templeDetails: buildLangJson(data.templeDetails_en || data.templeDetails, data.templeDetails_hi, data.templeDetails_mr),
                description: buildLangArray(
                    safeParse(data.description_en || data.description, []),
                    safeParse(data.description_hi, []),
                    safeParse(data.description_mr, [])
                ),
                benefits: buildLangArray(
                    safeParse(data.benefits_en || data.benefits, []),
                    safeParse(data.benefits_hi, []),
                    safeParse(data.benefits_mr, [])
                ),
                bullets: buildLangArray(
                    safeParse(data.bullets_en || data.bullets, []),
                    safeParse(data.bullets_hi, []),
                    safeParse(data.bullets_mr, [])
                ),
                price: parseFloat(data.price),
                time: data.time || '',
                processSteps: safeParse(data.processSteps, []),
                packages: safeParse(data.packages, []),
                faqs: safeParse(data.faqs, []),
                image: file ? `/uploads/poojas/${file.filename}` : null,
                mandalId,
                status: data.status === 'false' ? false : true,
                hasPrasad: data.hasPrasad === 'true' || data.hasPrasad === true,
                prasadType: 'FREE'
            }
        });

        res.status(201).json({ success: true, data: pooja });
    } catch (error: any) {
        console.error('Create Mandal Pooja Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMandalPooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const mandalId = (req as any).owner.ownerId;
        const file = req.file;
        const data = req.body;

        const existingPooja = await prisma.pooja.findFirst({ where: { id: String(id), mandalId } });
        if (!existingPooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found or unauthorized' });
        }

        const updatedPooja = await prisma.pooja.update({
            where: { id: String(id) },
            data: {
                name: buildLangJson(data.name_en || data.name, data.name_hi, data.name_mr),
                category: buildLangJson(data.category_en || data.category, data.category_hi, data.category_mr),
                duration: buildLangJson(data.duration_en || data.duration, data.duration_hi, data.duration_mr),
                about: buildLangJson(data.about_en || data.about, data.about_hi, data.about_mr),
                process: buildLangJson(data.process_en || data.process, data.process_hi, data.process_mr),
                templeDetails: buildLangJson(data.templeDetails_en || data.templeDetails, data.templeDetails_hi, data.templeDetails_mr),
                description: buildLangArray(
                    safeParse(data.description_en || data.description, []),
                    safeParse(data.description_hi, []),
                    safeParse(data.description_mr, [])
                ),
                benefits: buildLangArray(
                    safeParse(data.benefits_en || data.benefits, []),
                    safeParse(data.benefits_hi, []),
                    safeParse(data.benefits_mr, [])
                ),
                bullets: buildLangArray(
                    safeParse(data.bullets_en || data.bullets, []),
                    safeParse(data.bullets_hi, []),
                    safeParse(data.bullets_mr, [])
                ),
                price: parseFloat(data.price),
                time: data.time || existingPooja.time,
                processSteps: safeParse(data.processSteps, existingPooja.processSteps),
                packages: safeParse(data.packages, existingPooja.packages),
                faqs: safeParse(data.faqs, existingPooja.faqs),
                image: file ? `/uploads/poojas/${file.filename}` : undefined,
                status: data.status === 'false' ? false : data.status === 'true' ? true : undefined,
                hasPrasad: data.hasPrasad === 'true' || data.hasPrasad === true ? true : data.hasPrasad === 'false' || data.hasPrasad === false ? false : undefined,
            }
        });

        res.json({ success: true, data: updatedPooja });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMandalPooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const mandalId = (req as any).owner.ownerId;
        const existingPooja = await prisma.pooja.findFirst({ where: { id: String(id), mandalId } });
        if (!existingPooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found or unauthorized' });
        }
        await prisma.pooja.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Pooja deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleMandalPoojaStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const mandalId = (req as any).owner.ownerId;
        const existingPooja = await prisma.pooja.findFirst({ where: { id: String(id), mandalId } });
        if (!existingPooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found or unauthorized' });
        }
        const updatedPooja = await prisma.pooja.update({
            where: { id: String(id) },
            data: { status: !existingPooja.status }
        });
        res.json({ success: true, data: updatedPooja });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

