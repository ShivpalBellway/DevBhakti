import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildLangJson, buildLangArray, getLang, localize } from '../../utils/localization';
import slugify from 'slugify';

// Helper: safely parse JSON string or return default
const safeParse = (val: any, fallback: any = null) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return fallback; }
};

const generateUniqueSlug = async (baseSlug: string, model: any, excludeId?: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
        const existing = await model.findFirst({
            where: {
                slug,
                NOT: excludeId ? { id: excludeId } : undefined
            }
        });
        
        if (!existing) return slug;
        
        // If exists, append counter or random string
        slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        // Alternatively: slug = `${baseSlug}-${counter++}`;
        // Random string is safer for high concurrency or many duplicates
    }
};

export const getAllPoojas = async (req: Request, res: Response) => {
    try {
        const { isMaster, templeId, mandalId, search, poojaId } = req.query;

        const where: any = {};
        if (poojaId) where.id = String(poojaId);
        if (isMaster !== undefined) where.isMaster = isMaster === 'true';
        if (templeId) {
            if (templeId === 'null') {
                where.templeId = null;
            } else if (templeId === 'not_null') {
                where.templeId = { not: null };
            } else {
                where.templeId = String(templeId);
            }
        }
        if (mandalId) {
            if (mandalId === 'null') {
                where.mandalId = null;
            } else if (mandalId === 'not_null') {
                where.mandalId = { not: null };
            } else {
                where.mandalId = String(mandalId);
            }
        }
        if (search) {
            where.OR = [
                { name: { path: ['en'], string_contains: String(search) } },
                { name: { path: ['hi'], string_contains: String(search) } },
                { category: { path: ['en'], string_contains: String(search) } },
            ];
        }

        const poojas = await prisma.pooja.findMany({
            where,
            include: {
                temple: {
                    select: { name: true }   // Json field — frontend handles display
                },
                mandal: {
                    select: { name: true }
                },
                masterPooja: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const lang = getLang(req);
        if (lang === 'raw') return res.json(poojas);
        res.json(localize(poojas as any[], lang));
    } catch (error) {
        console.error('Fetch poojas error:', error);
        res.status(500).json({ error: 'Failed to fetch poojas' });
    }
};

export const getPoojaById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pooja = await prisma.pooja.findUnique({
            where: { id: String(id) },
            include: {
                temple: {
                    select: { name: true, id: true }
                },
                masterPooja: {
                    select: { name: true, id: true }
                }
            }
        });

        if (!pooja) {
            return res.status(404).json({ error: 'Pooja not found' });
        }

        const lang = getLang(req);
        res.json({
            success: true,
            data: lang === 'raw' ? pooja : localize(pooja, lang)
        });
    } catch (error) {
        console.error('Fetch pooja error:', error);
        res.status(500).json({ error: 'Failed to fetch pooja' });
    }
};

export const createPooja = async (req: Request, res: Response) => {
    try {
        console.log('=== CREATE POOJA DEBUG ===');
        console.log('Request body keys:', Object.keys(req.body));

        const {
            name_en, name_hi, name_mr,
            category_en, category_hi, category_mr,
            price,
            duration_en, duration_hi, duration_mr,
            description_en, description_hi, description_mr,
            time,
            about_en, about_hi, about_mr,
            benefits_en, benefits_hi, benefits_mr,
            bullets_en, bullets_hi, bullets_mr,
            process_en, process_hi, process_mr,
            processSteps_en, processSteps_hi, processSteps_mr,
            templeId,
            packages,
            faqs,
            isMaster,
            masterPoojaId,
            templeDetails_en, templeDetails_hi, templeDetails_mr,
            categoryId, categoryIds,
            hasPrasad
        } = req.body;

        // Validate temple exists if provided
        if (templeId && templeId !== 'null' && templeId !== 'undefined') {
            const temple = await prisma.temple.findUnique({ where: { id: String(templeId) } });
            if (!temple) {
                return res.status(400).json({ error: 'Invalid templeId: Temple does not exist' });
            }
        }

        // Validate category exists if provided
        if (categoryId && categoryId !== 'null' && categoryId !== 'undefined') {
            const category = await prisma.poojaCategory.findUnique({ where: { id: String(categoryId) } });
            if (!category) {
                return res.status(400).json({ error: 'Invalid categoryId: Category does not exist' });
            }
        }

        // Handle image path — Image is REQUIRED
        if (!req.file) {
            return res.status(400).json({
                error: 'Image is required. Please upload a pooja image before creating.'
            });
        }
        const imagePath = `/uploads/poojas/${req.file.filename}`;

        const baseSlug = req.body.slug || slugify(name_en || req.body.name, { lower: true, strict: true });
        const uniqueSlug = await generateUniqueSlug(baseSlug, prisma.pooja);

        const pooja = await prisma.pooja.create({
            data: {
                // Multilingual JSON fields
                name: buildLangJson(name_en || req.body.name, name_hi, name_mr),
                category: buildLangJson(category_en || req.body.category, category_hi, category_mr),
                duration: buildLangJson(duration_en || req.body.duration, duration_hi, duration_mr),
                about: buildLangJson(about_en || req.body.about, about_hi, about_mr),
                process: buildLangJson(process_en || req.body.process, process_hi, process_mr),
                templeDetails: buildLangJson(templeDetails_en || req.body.templeDetails, templeDetails_hi, templeDetails_mr),

                // Array multilingual fields — stored as Json
                description: buildLangArray(
                    safeParse(description_en || req.body.description, []),
                    safeParse(description_hi, []),
                    safeParse(description_mr, [])
                ),
                benefits: buildLangArray(
                    safeParse(benefits_en || req.body.benefits, []),
                    safeParse(benefits_hi, []),
                    safeParse(benefits_mr, [])
                ),
                bullets: buildLangArray(
                    safeParse(bullets_en || req.body.bullets, []),
                    safeParse(bullets_hi, []),
                    safeParse(bullets_mr, [])
                ),
                slug: uniqueSlug,

                // Non-multilingual fields
                price: parseFloat(price),
                time,
                image: imagePath,
                processSteps: buildLangArray(
                    safeParse(processSteps_en || req.body.processSteps, []),
                    safeParse(processSteps_hi, []),
                    safeParse(processSteps_mr, [])
                ),
                templeId: (templeId && templeId !== 'null') ? String(templeId) : null,
                isMaster: isMaster === 'true' || isMaster === true,
                masterPoojaId: (masterPoojaId && masterPoojaId !== 'null' && masterPoojaId !== 'undefined' && masterPoojaId !== '') ? String(masterPoojaId) : null,
                categoryId: (categoryId && categoryId !== 'null') ? String(categoryId) : null,
                categoryIds: safeParse(categoryIds, []),
                packages: safeParse(packages),
                faqs: safeParse(faqs),
                hasPrasad: hasPrasad === 'true' || hasPrasad === true,
                prasadType: 'FREE'
            }
        });

        res.status(201).json(pooja);
    } catch (error: any) {
        console.error('Create pooja error:', error);
        res.status(500).json({ 
            error: 'Failed to create pooja', 
            message: error.message,
            details: error.code || undefined
        });
    }
};

export const updatePooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name_en, name_hi, name_mr,
            category_en, category_hi, category_mr,
            price,
            duration_en, duration_hi, duration_mr,
            description_en, description_hi, description_mr,
            time,
            about_en, about_hi, about_mr,
            benefits_en, benefits_hi, benefits_mr,
            bullets_en, bullets_hi, bullets_mr,
            process_en, process_hi, process_mr,
            processSteps_en, processSteps_hi, processSteps_mr,
            templeId,
            packages,
            faqs,
            templeDetails_en, templeDetails_hi, templeDetails_mr,
            categoryId, categoryIds,
            masterPoojaId,
            hasPrasad
        } = req.body;

        // Validate temple exists if templeId is provided
        if (templeId && templeId !== 'null' && templeId !== 'undefined') {
            const temple = await prisma.temple.findUnique({ where: { id: String(templeId) } });
            if (!temple) {
                return res.status(400).json({ error: 'Invalid templeId: Temple does not exist' });
            }
        }

        const updateData: any = {
            // Multilingual JSON fields
            name: buildLangJson(name_en || req.body.name, name_hi, name_mr),
            category: buildLangJson(category_en || req.body.category, category_hi, category_mr),
            duration: buildLangJson(duration_en || req.body.duration, duration_hi, duration_mr),
            about: buildLangJson(about_en || req.body.about, about_hi, about_mr),
            process: buildLangJson(process_en || req.body.process, process_hi, process_mr),
            templeDetails: buildLangJson(templeDetails_en || req.body.templeDetails, templeDetails_hi, templeDetails_mr),
            
            // Array multilingual fields
            description: buildLangArray(
                safeParse(description_en || req.body.description, []),
                safeParse(description_hi, []),
                safeParse(description_mr, [])
            ),
            benefits: buildLangArray(
                safeParse(benefits_en || req.body.benefits, []),
                safeParse(benefits_hi, []),
                safeParse(benefits_mr, [])
            ),
            bullets: buildLangArray(
                safeParse(bullets_en || req.body.bullets, []),
                safeParse(bullets_hi, []),
                safeParse(bullets_mr, [])
            ),

            // Non-multilingual
            price: price ? parseFloat(price) : undefined,
            time,
            processSteps: buildLangArray(
                safeParse(processSteps_en || req.body.processSteps, []),
                safeParse(processSteps_hi, []),
                safeParse(processSteps_mr, [])
            ),
            templeId: templeId !== undefined ? ((templeId === 'null' || !templeId) ? null : String(templeId)) : undefined,
            masterPoojaId: masterPoojaId !== undefined ? ((masterPoojaId === 'null' || masterPoojaId === 'undefined' || !masterPoojaId) ? null : String(masterPoojaId)) : undefined,
            categoryId: categoryId !== undefined ? ((categoryId === 'null' || !categoryId) ? null : String(categoryId)) : undefined,
            categoryIds: categoryIds !== undefined ? safeParse(categoryIds, []) : undefined,
            packages: safeParse(packages),
            faqs: safeParse(faqs),
            ...(hasPrasad !== undefined && { hasPrasad: hasPrasad === 'true' || hasPrasad === true })
        };

        if (req.body.slug !== undefined) {
             const baseSlug = req.body.slug || slugify(name_en || req.body.name, { lower: true, strict: true });
             updateData.slug = await generateUniqueSlug(baseSlug, prisma.pooja, String(id));
        }

        if (req.body.isMaster !== undefined) {
            updateData.isMaster = req.body.isMaster === 'true' || req.body.isMaster === true;
        }

        if (req.file) {
            updateData.image = `/uploads/poojas/${req.file.filename}`;
        } else {
            // No new file uploaded — check if existing image is present
            const existingPooja = await prisma.pooja.findUnique({
                where: { id: String(id) },
                select: { image: true }
            });
            if (!existingPooja?.image || existingPooja.image.trim() === '') {
                return res.status(400).json({
                    error: 'Image is required. Please upload a pooja image before saving.'
                });
            }
            // Keep existing image — do not overwrite with empty
        }

        const pooja = await prisma.pooja.update({
            where: { id: String(id) },
            data: updateData
        });

        res.json(pooja);
    } catch (error: any) {
        console.error('Update pooja error:', error);
        res.status(500).json({ 
            error: 'Failed to update pooja',
            message: error.message,
            details: error.code || undefined
        });
    }
};

export const deletePooja = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for related data (bookings) before deletion to prevent P2003 constraint errors
        const bookingsCount = await prisma.poojaBooking.count({
            where: { poojaId: String(id) }
        });

        if (bookingsCount > 0) {
            return res.status(400).json({
                error: `Cannot delete this pooja because it has ${bookingsCount} existing booking(s). Please remove or manage them first.`,
                message: 'This pooja cannot be deleted as it is associated with user bookings.',
                relatedData: { bookings: bookingsCount }
            });
        }

        await prisma.pooja.delete({ where: { id: String(id) } });
        res.json({ message: 'Pooja deleted successfully' });
    } catch (error: any) {
        console.error('Delete pooja error:', error);
        
        // Handle unexpected constraint violations just in case
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                error: 'Cannot delete because this pooja is linked to other active records (like bookings or reviews).',
                code: 'P2003'
            });
        }

        res.status(500).json({ error: 'Failed to delete pooja' });
    }
};

/**
 * Promote a Temple Pooja to a Master Pooja template
 */
export const promoteToMaster = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const templePooja = await prisma.pooja.findUnique({ where: { id: String(id) } });

        if (!templePooja) {
            return res.status(404).json({ error: 'Pooja not found' });
        }

        const masterPooja = await prisma.pooja.create({
            data: {
                // Copy all Json fields directly (they're already in {"en","hi","mr"} format)
                name: (templePooja.name as any),
                category: (templePooja.category as any),
                duration: (templePooja.duration as any),
                description: (templePooja.description as any),
                about: (templePooja.about as any),
                benefits: (templePooja.benefits as any),
                bullets: (templePooja.bullets as any),
                process: (templePooja.process as any),
                templeDetails: (templePooja.templeDetails as any),
                price: templePooja.price,
                time: templePooja.time,
                image: templePooja.image,
                processSteps: templePooja.processSteps || undefined,
                templeId: null, // Master poojas don't belong to a temple
                isMaster: true,
                packages: templePooja.packages || undefined,
                faqs: templePooja.faqs || undefined
            }
        });

        // Link original to master
        await prisma.pooja.update({
            where: { id: String(id) },
            data: { masterPoojaId: masterPooja.id }
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

        const pooja = await prisma.pooja.findUnique({ where: { id: String(id) } });

        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }

        // Block activation if image is missing
        if (!pooja.status && (!pooja.image || pooja.image.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Image is required. Please upload a pooja image before activating it.'
            });
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
