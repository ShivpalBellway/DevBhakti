import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to get file paths
const getFilePath = (files: any, fieldName: string): any => {
    if (!files || !files[fieldName]) return null;
    if (fieldName === 'image') return `/uploads/temples/${files[fieldName][0].filename}`;
    return files[fieldName].map((f: any) => `/uploads/temples/${f.filename}`);
};

// Get all Institutions
export const getAllInstitutions = async (req: Request, res: Response) => {
    try {
        const institutions = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'INSTITUTION' },
                    { temple: { isNot: null } }
                ]
            },
            include: {
                temple: {
                    include: {
                        _count: {
                            select: { poojas: true, events: true },
                        },
                        poojas: {
                            select: { id: true, name: true, category: true, price: true, duration: true }
                        },
                        events: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(institutions);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch institutions' });
    }
};

// Create Institution
export const createInstitution = async (req: Request, res: Response) => {
    try {
        const files = req.files as any;
        const data = req.body;

        // Parse JSON fields safely
        const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
        const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];

        const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User & Temple
            const user = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    password: hashedPassword,
                    role: 'INSTITUTION',
                    isVerified: true,
                    temple: {
                        create: {
                            name: data.templeName,
                            location: data.location,
                            fullAddress: data.fullAddress,
                            description: data.description,
                            history: data.history,
                            category: data.category,
                            openTime: data.openTime,
                            phone: data.templePhone,
                            website: data.website,
                            mapUrl: data.mapUrl,
                            viewers: data.viewers,
                            rating: parseFloat(data.rating || '0'),
                            reviewsCount: parseInt(data.reviewsCount || '0'),
                            liveStatus: data.liveStatus === 'true',
                            image: getFilePath(files, 'image'),
                            heroImages: getFilePath(files, 'heroImages') || [],
                        }
                    }
                },
                include: { temple: true }
            });

            const templeId = user.temple!.id;

            // 2. Connect Poojas
            if (poojaIds.length > 0) {
                await tx.pooja.updateMany({
                    where: { id: { in: poojaIds } },
                    data: { templeId: templeId }
                });
            }

            // 3. Create Inline Events
            if (inlineEvents.length > 0) {
                await tx.event.createMany({
                    data: inlineEvents.map((ev: any) => ({
                        name: ev.name,
                        date: ev.date,
                        description: ev.description || '',
                        templeId: templeId
                    }))
                });
            }

            return user;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Create error:', error);
        res.status(500).json({ error: error.message || 'Failed to create institution' });
    }
};

// Update Institution
export const updateInstitution = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const files = req.files as any;
        const data = req.body;

        const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
        const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];
        const existingHeroImages = data.existingHeroImages ? JSON.parse(data.existingHeroImages) : [];

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update User & Temple
            const user = await tx.user.update({
                where: { id: String(id) },
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    temple: {
                        update: {
                            name: data.templeName,
                            location: data.location,
                            fullAddress: data.fullAddress,
                            description: data.description,
                            history: data.history,
                            category: data.category,
                            openTime: data.openTime,
                            phone: data.templePhone,
                            website: data.website,
                            mapUrl: data.mapUrl,
                            viewers: data.viewers,
                            rating: parseFloat(data.rating || '0'),
                            reviewsCount: parseInt(data.reviewsCount || '0'),
                            liveStatus: data.liveStatus === 'true',
                            // Merge image updates
                            ...(files?.image && { image: getFilePath(files, 'image') }),
                            heroImages: [
                                ...existingHeroImages,
                                ...(getFilePath(files, 'heroImages') || [])
                            ]
                        }
                    }
                },
                include: { temple: true }
            });

            const templeId = user.temple!.id;

            // 2. Sync Poojas
            // Note: Since Pooja must have a templeId, we can't unassign without a fallback.
            // For now, only update the ones chosen to point to this temple.
            if (poojaIds.length > 0) {
                await tx.pooja.updateMany({
                    where: { id: { in: poojaIds } },
                    data: { templeId: templeId }
                });
            }

            // 3. Sync Events
            if (data.inlineEvents) {
                // If the user managed events inline, we replace them for this temple
                await tx.event.deleteMany({ where: { templeId: templeId } });
                if (inlineEvents.length > 0) {
                    await tx.event.createMany({
                        data: inlineEvents.map((ev: any) => ({
                            name: ev.name,
                            date: ev.date,
                            description: ev.description || '',
                            templeId: templeId
                        }))
                    });
                }
            }

            return user;
        });

        res.json(result);
    } catch (error: any) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message || 'Failed to update institution' });
    }
};

// Delete Institution
export const deleteInstitution = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id: String(id) } });
        res.json({ message: 'Institution deleted successfully' });
    } catch (error: any) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete institution' });
    }
};
