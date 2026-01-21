import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getMyPoojas = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found for this user' });
        }

        const poojas = await prisma.pooja.findMany({
            where: { templeId: temple.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: poojas });
    } catch (error: any) {
        console.error('Fetch Poojas Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMyPooja = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const file = req.file;
        const data = req.body;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }

        const pooja = await prisma.pooja.create({
            data: {
                name: data.name,
                category: data.category,
                price: parseFloat(data.price),
                duration: data.duration,
                description: data.description ? JSON.parse(data.description) : [],
                time: data.time || '',
                about: data.about,
                benefits: data.benefits ? JSON.parse(data.benefits) : [],
                bullets: data.bullets ? JSON.parse(data.bullets) : [],
                process: data.process,
                processSteps: data.processSteps ? JSON.parse(data.processSteps) : [],
                templeDetails: data.templeDetails,
                packages: data.packages ? JSON.parse(data.packages) : [],
                faqs: data.faqs ? JSON.parse(data.faqs) : [],
                image: file ? `/uploads/poojas/${file.filename}` : null,
                templeId: temple.id,
                status: data.status === 'false' ? false : true
            }
        });

        res.status(201).json({ success: true, data: pooja });
    } catch (error: any) {
        console.error('Create Pooja Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMyPooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;
        const file = req.file;
        const data = req.body;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        const existingPooja = await prisma.pooja.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });

        if (!existingPooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found or unauthorized' });
        }

        const updatedPooja = await prisma.pooja.update({
            where: { id: String(id) },
            data: {
                name: data.name,
                category: data.category,
                price: parseFloat(data.price),
                duration: data.duration,
                description: data.description ? JSON.parse(data.description) : undefined,
                time: data.time,
                about: data.about,
                benefits: data.benefits ? JSON.parse(data.benefits) : undefined,
                bullets: data.bullets ? JSON.parse(data.bullets) : undefined,
                process: data.process,
                processSteps: data.processSteps ? JSON.parse(data.processSteps) : undefined,
                templeDetails: data.templeDetails,
                packages: data.packages ? JSON.parse(data.packages) : undefined,
                faqs: data.faqs ? JSON.parse(data.faqs) : undefined,
                status: data.status === 'false' ? false : data.status === 'true' ? true : undefined,
                ...(file && { image: `/uploads/poojas/${file.filename}` })
            }
        });

        res.json({ success: true, data: updatedPooja });
    } catch (error: any) {
        console.error('Update Pooja Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMyPooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        const pooja = await prisma.pooja.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });

        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found or unauthorized' });
        }

        await prisma.pooja.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Pooja deleted successfully' });
    } catch (error: any) {
        console.error('Delete Pooja Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const togglePoojaStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const temple = await prisma.temple.findUnique({
            where: { userId }
        });

        const pooja = await prisma.pooja.findFirst({
            where: { id: String(id), templeId: temple?.id }
        });

        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found or unauthorized' });
        }

        const updatedPooja = await prisma.pooja.update({
            where: { id: String(id) },
            data: { status: !pooja.status }
        });

        res.json({ success: true, data: updatedPooja });
    } catch (error: any) {
        console.error('Toggle Pooja Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
