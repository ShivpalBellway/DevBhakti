import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getAllPoojas = async (req: Request, res: Response) => {
    try {
        const poojas = await prisma.pooja.findMany({
            include: {
                temple: {
                    select: {
                        name: true
                    }
                }
            }
        });
        res.json(poojas);
    } catch (error) {
        console.error('Fetch poojas error:', error);
        res.status(500).json({ error: 'Failed to fetch poojas' });
    }
};

export const createPooja = async (req: Request, res: Response) => {
    try {
        const {
            name,
            category,
            price,
            duration,
            description,
            time,
            about,
            benefits,
            bullets,
            process,
            processSteps,
            templeId,
            packages,
            faqs
        } = req.body;

        // Handle image path
        let imagePath = '';
        if (req.file) {
            imagePath = `/uploads/poojas/${req.file.filename}`;
        }

        const pooja = await prisma.pooja.create({
            data: {
                name,
                category,
                price: parseFloat(price),
                duration,
                description: typeof description === 'string' ? JSON.parse(description) : description,
                time,
                image: imagePath,
                about,
                benefits: typeof benefits === 'string' ? JSON.parse(benefits) : benefits,
                bullets: typeof bullets === 'string' ? JSON.parse(bullets) : bullets,
                process,
                processSteps: typeof processSteps === 'string' ? JSON.parse(processSteps) : processSteps,
                templeId: String(templeId),
                packages: typeof packages === 'string' ? JSON.parse(packages) : packages,
                faqs: typeof faqs === 'string' ? JSON.parse(faqs) : faqs
            }
        });

        res.status(201).json(pooja);
    } catch (error) {
        console.error('Create pooja error:', error);
        res.status(500).json({ error: 'Failed to create pooja' });
    }
};

export const updatePooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            category,
            price,
            duration,
            description,
            time,
            about,
            benefits,
            bullets,
            process,
            processSteps,
            templeId,
            packages,
            faqs
        } = req.body;

        // Handle image path
        let updateData: any = {
            name,
            category,
            price: parseFloat(price),
            duration,
            description: typeof description === 'string' ? JSON.parse(description) : description,
            time,
            about,
            benefits: typeof benefits === 'string' ? JSON.parse(benefits) : benefits,
            bullets: typeof bullets === 'string' ? JSON.parse(bullets) : bullets,
            process,
            processSteps: typeof processSteps === 'string' ? JSON.parse(processSteps) : processSteps,
            templeId: String(templeId),
            packages: typeof packages === 'string' ? JSON.parse(packages) : packages,
            faqs: typeof faqs === 'string' ? JSON.parse(faqs) : faqs
        };

        if (req.file) {
            updateData.image = `/uploads/poojas/${req.file.filename}`;
        }

        const pooja = await prisma.pooja.update({
            where: { id: String(id) },
            data: updateData
        });

        res.json(pooja);
    } catch (error) {
        console.error('Update pooja error:', error);
        res.status(500).json({ error: 'Failed to update pooja' });
    }
};

export const deletePooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.pooja.delete({
            where: { id: String(id) }
        });
        res.json({ message: 'Pooja deleted successfully' });
    } catch (error) {
        console.error('Delete pooja error:', error);
        res.status(500).json({ error: 'Failed to delete pooja' });
    }
};
