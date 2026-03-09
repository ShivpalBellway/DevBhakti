import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getAllPoojas = async (req: Request, res: Response) => {
    try {
        const { isMaster, templeId, search, poojaId } = req.query;

        const where: any = {};
        if (poojaId) {
            where.id = String(poojaId);
        }
        if (isMaster !== undefined) {
            where.isMaster = isMaster === 'true';
        }
        if (templeId) {
            where.templeId = String(templeId);
        }
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { category: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        const poojas = await prisma.pooja.findMany({
            where,
            include: {
                temple: {
                    select: {
                        name: true
                    }
                },
                masterPooja: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(poojas);
    } catch (error) {
        console.error('Fetch poojas error:', error);
        res.status(500).json({ error: 'Failed to fetch poojas' });
    }
};

export const createPooja = async (req: Request, res: Response) => {
    try {
        console.log('=== CREATE POOJA DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

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
            faqs,
            isMaster,
            masterPoojaId
        } = req.body;

        // Validate temple exists if provided
        if (templeId && templeId !== 'null' && templeId !== 'undefined') {
            const temple = await prisma.temple.findUnique({
                where: { id: String(templeId) }
            });

            if (!temple) {
                return res.status(400).json({ error: 'Invalid templeId: Temple does not exist' });
            }
        }

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
                templeId: (templeId && templeId !== 'null') ? String(templeId) : null,
                isMaster: isMaster === 'true' || isMaster === true,
                masterPoojaId: masterPoojaId || null,
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

        // Validate temple exists if templeId is provided
        if (templeId) {
            const temple = await prisma.temple.findUnique({
                where: { id: String(templeId) }
            });

            if (!temple) {
                return res.status(400).json({ error: 'Invalid templeId: Temple does not exist' });
            }
        }

        // Handle image path
        let updateData: any = {
            name,
            category,
            price: price ? parseFloat(price) : undefined,
            duration,
            description: typeof description === 'string' ? JSON.parse(description) : description,
            time,
            about,
            benefits: typeof benefits === 'string' ? JSON.parse(benefits) : benefits,
            bullets: typeof bullets === 'string' ? JSON.parse(bullets) : bullets,
            process,
            processSteps: typeof processSteps === 'string' ? JSON.parse(processSteps) : processSteps,
            templeId: (templeId && templeId !== 'null') ? String(templeId) : undefined,
            packages: typeof packages === 'string' ? JSON.parse(packages) : packages,
            faqs: typeof faqs === 'string' ? JSON.parse(faqs) : faqs
        };

        if (req.body.isMaster !== undefined) {
            updateData.isMaster = req.body.isMaster === 'true' || req.body.isMaster === true;
        }

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

/**
 * Promote a Temple Pooja to a Master Pooja template
 */
export const promoteToMaster = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const templePooja = await prisma.pooja.findUnique({
            where: { id: String(id) }
        });

        if (!templePooja) {
            return res.status(404).json({ error: 'Pooja not found' });
        }

        // Create a new Master Pooja using temple pooja data
        const masterPooja = await prisma.pooja.create({
            data: {
                name: templePooja.name,
                category: templePooja.category,
                price: templePooja.price,
                duration: templePooja.duration,
                description: templePooja.description as string[],
                time: templePooja.time,
                image: templePooja.image,
                about: templePooja.about,
                benefits: templePooja.benefits as string[],
                bullets: templePooja.bullets as string[],
                process: templePooja.process,
                processSteps: templePooja.processSteps || undefined,
                templeId: null, // Master poojas don't belong to a temple
                isMaster: true,
                packages: templePooja.packages || undefined,
                faqs: templePooja.faqs || undefined
            }
        });

        // Update the original temple pooja to link it to this master
        await prisma.pooja.update({
            where: { id: String(id) },
            data: {
                masterPoojaId: masterPooja.id
            }
        });

        res.json({
            message: 'Pooja promoted to Master template successfully',
            masterPooja
        });
    } catch (error) {
        console.error('Promote pooja error:', error);
        res.status(500).json({ error: 'Failed to promote pooja' });
    }
};

// Toggle Pooja Status (active/inactive)
export const togglePoojaStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const pooja = await prisma.pooja.findUnique({
            where: { id: String(id) }
        });

        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
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
