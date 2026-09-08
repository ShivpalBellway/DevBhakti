import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildLangJson, getLang, localize } from '../../utils/localization';
import { generateCustomId } from '../../utils/idGenerator';

const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
    if (cleaned.length === 11 && cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        // Keep as is
    } else if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    if (cleaned.length === 14 && cleaned.startsWith('9191')) {
        cleaned = cleaned.substring(2);
    }
    return '+' + cleaned;
};

// ─── Helper: build file path ─────────────────────────────────────────────────
const getFilePath = (files: any, fieldName: string): any => {
    if (!files || !files[fieldName]) return null;
    if (fieldName === 'image') return `/uploads/mandals/${files[fieldName][0].filename}`;
    return files[fieldName].map((f: any) => `/uploads/mandals/${f.filename}`);
};

// ─── GET ALL MANDALS (paginated) ─────────────────────────────────────────────
export const getAllMandals = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page, limit, search, status, isActive } = req.query;
        const lang = (req.query.lang as string) || getLang(req);

        const where: any = {};

        if (status && status !== 'ALL') {
            where.status = String(status);
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (search) {
            const searchStr = String(search).trim();
            where.OR = [
                { name: { path: ['en'], string_contains: searchStr } },
                { name: { path: ['hi'], string_contains: searchStr } },
                { name: { path: ['mr'], string_contains: searchStr } },
                { city: { contains: searchStr, mode: 'insensitive' } },
                { state: { contains: searchStr, mode: 'insensitive' } },
                { contactNumber: { contains: searchStr, mode: 'insensitive' } },
                { presidentName: { contains: searchStr, mode: 'insensitive' } },
                { email: { contains: searchStr, mode: 'insensitive' } },
                { registrationNumber: { contains: searchStr, mode: 'insensitive' } },
            ];
        }

        const p = parseInt(String(page || '1'));
        const l = parseInt(String(limit || '20'));
        const skip = (p - 1) * l;

        const [mandals, total] = await Promise.all([
            prisma.mandal.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: l,
            }),
            prisma.mandal.count({ where }),
        ]);

        res.json({
            success: true,
            data: lang === 'raw' ? mandals : localize(mandals, lang),
            pagination: {
                total,
                page: p,
                limit: l,
                totalPages: Math.ceil(total / l),
            },
        });
    } catch (error: any) {
        console.error('getAllMandals error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mandals', error: error.message });
    }
};

// ─── GET MANDAL BY ID / SLUG ─────────────────────────────────────────────────
export const getMandalById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const lang = getLang(req);

        const mandal = await prisma.mandal.findFirst({
            where: { OR: [{ id }, { slug: id }] },
        });

        if (!mandal) {
            res.status(404).json({ success: false, message: 'Mandal not found' });
            return;
        }

        res.json({
            success: true,
            data: lang === 'raw' ? mandal : localize(mandal, lang),
        });
    } catch (error: any) {
        console.error('getMandalById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mandal', error: error.message });
    }
};

// ─── CREATE MANDAL (ADMIN) ───────────────────────────────────────────────────
export const createMandal = async (req: Request, res: Response): Promise<void> => {
    try {
        const files = req.files as any;
        const data = req.body;

        if (!data.contactNumber) {
            res.status(400).json({ success: false, message: 'Contact number is required' });
            return;
        }

        let cleanedContact = data.contactNumber.replace(/\D/g, '');
        if (cleanedContact.length > 10 && cleanedContact.startsWith('91')) {
            cleanedContact = cleanedContact.substring(2);
        } else if (cleanedContact.length > 10 && cleanedContact.startsWith('0')) {
            cleanedContact = cleanedContact.substring(1);
        }

        const normalizedPhone = normalizePhone(cleanedContact);
        const digits = normalizedPhone.replace(/\D/g, '');
        const phoneVariants = [normalizedPhone, digits, cleanedContact, '91' + cleanedContact, '0' + cleanedContact, '+91' + cleanedContact];

        const existingMandal = await prisma.mandal.findFirst({
            where: { contactNumber: { in: phoneVariants } }
        });

        if (existingMandal) {
            res.status(400).json({ success: false, message: 'This number is already registered with an existing mandal.' });
            return;
        }

        if (data.email) {
            const emailToCheck = data.email.toLowerCase().trim();
            const existingEmailMandal = await prisma.mandal.findFirst({
                where: { email: emailToCheck }
            });
            
            if (existingEmailMandal) {
                res.status(400).json({ success: false, message: 'This email is already registered with another mandal' });
                return;
            }
        }

        // Safely parse existing banner images
        const existingBannerImages: string[] = data.existingBannerImages
            ? JSON.parse(data.existingBannerImages)
            : [];

        // Create linked User account for MANDAL role login
        let user = await prisma.user.findFirst({
            where: { phone: { in: phoneVariants }, role: 'MANDAL' }
        });

        if (!user) {
            let nameStr = data.presidentName || data.name_en || data.name || 'Mandal Admin';
            const displayId = await generateCustomId('MNID');
            user = await prisma.user.create({
                data: {
                    displayId,
                    phone: normalizedPhone,
                    name: nameStr,
                    email: data.email ? data.email.toLowerCase().trim() : null,
                    role: 'MANDAL',
                    isVerified: true,
                    isActive: true
                }
            });
        }

        const mandal = await prisma.mandal.create({
            data: {
                name: JSON.stringify(buildLangJson(data.name_en || data.name, data.name_hi, data.name_mr)),
                description: JSON.stringify(buildLangJson(data.description_en || data.description, data.description_hi, data.description_mr)),
                about: data.about ? (typeof data.about === 'string' ? JSON.parse(data.about) : data.about) : undefined,
                mandalType: data.mandalType || undefined,
                establishedYear: data.establishedYear || undefined,
                presiding_deity: data.presiding_deity || undefined,
                festivals: data.festivals || undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                pinCode: data.pinCode || undefined,
                contactNumber: normalizedPhone,
                userId: user.id,
                email: data.email || undefined,
                presidentName: data.presidentName || undefined,
                registrationNumber: data.registrationNumber || undefined,
                verificationDocUrl: data.verificationDocUrl || undefined,
                presidentIdDocUrl: data.presidentIdDocUrl || undefined,
                // Media
                image: getFilePath(files, 'image') || data.imageUrl || undefined,
                bannerImages: [
                    ...existingBannerImages,
                    ...(getFilePath(files, 'bannerImages') || []),
                ],
                documentUrl: getFilePath(files, 'documentUrl') || data.documentUrl || undefined,
                // Meta
                slug: data.slug || undefined,
                isActive: data.isActive === 'true' || data.isActive === true,
                status: data.status || 'APPROVED',
                adminNotes: data.adminNotes || undefined,
            },
        });

        res.status(201).json({ success: true, message: 'Mandal created successfully', data: mandal });
    } catch (error: any) {
        console.error('createMandal error:', error);
        if (error.code === 'P2002') {
            if (error.meta?.target?.includes('slug')) {
                res.status(400).json({ success: false, message: 'This slug is already in use by another mandal. Please provide a unique slug.' });
                return;
            }
            if (error.meta?.target?.includes('email')) {
                res.status(400).json({ success: false, message: 'This email is already registered with an existing user account.' });
                return;
            }
            if (error.meta?.target?.includes('phone') || error.meta?.target?.includes('contactNumber')) {
                res.status(400).json({ success: false, message: 'This number is already registered with an existing account.' });
                return;
            }
        }
        res.status(500).json({ success: false, message: 'Failed to create mandal', error: error.message });
    }
};

// ─── UPDATE MANDAL (ADMIN) ───────────────────────────────────────────────────
export const updateMandal = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const files = req.files as any;
        const data = req.body;

        const existing = await prisma.mandal.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Mandal not found' });
            return;
        }

        if (data.contactNumber) {
            let cleanedContact = data.contactNumber.replace(/\D/g, '');
            if (cleanedContact.length > 10 && cleanedContact.startsWith('91')) {
                cleanedContact = cleanedContact.substring(2);
            }
            if (cleanedContact !== existing.contactNumber) {
                const existingMandal = await prisma.mandal.findFirst({
                    where: { contactNumber: cleanedContact }
                });

                if (existingMandal) {
                    res.status(400).json({ success: false, message: 'This number is already with us in mandal register form' });
                    return;
                }
            }
            data.contactNumber = cleanedContact;
        }

        if (data.email) {
            const emailToCheck = data.email.toLowerCase().trim();
            if (emailToCheck !== existing.email?.toLowerCase()) {
                const existingEmailMandal = await prisma.mandal.findFirst({
                    where: { email: emailToCheck }
                });
                
                if (existingEmailMandal) {
                    res.status(400).json({ success: false, message: 'This email is already registered with another mandal' });
                    return;
                }
            }
        }

        const existingBannerImages: string[] = data.existingBannerImages
            ? JSON.parse(data.existingBannerImages)
            : (existing.bannerImages as string[]);

        const mandal = await prisma.mandal.update({
            where: { id },
            data: {
                name: JSON.stringify(buildLangJson(data.name_en || data.name, data.name_hi, data.name_mr)),
                description: JSON.stringify(buildLangJson(data.description_en || data.description, data.description_hi, data.description_mr)),
                about: data.about ? (typeof data.about === 'string' ? JSON.parse(data.about) : data.about) : undefined,
                mandalType: data.mandalType || undefined,
                establishedYear: data.establishedYear || undefined,
                presiding_deity: data.presiding_deity || undefined,
                festivals: data.festivals || undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                pinCode: data.pinCode || undefined,
                contactNumber: data.contactNumber,
                email: data.email || undefined,
                presidentName: data.presidentName || undefined,
                registrationNumber: data.registrationNumber || undefined,
                verificationDocUrl: data.verificationDocUrl || undefined,
                presidentIdDocUrl: data.presidentIdDocUrl || undefined,
                // Media
                ...(files?.image && { image: getFilePath(files, 'image') }),
                bannerImages: [
                    ...existingBannerImages,
                    ...(getFilePath(files, 'bannerImages') || []),
                ],
                ...(files?.documentUrl && { documentUrl: getFilePath(files, 'documentUrl') }),
                // Meta
                slug: data.slug || existing.slug || undefined,
                isActive: data.isActive !== undefined
                    ? (data.isActive === 'true' || data.isActive === true)
                    : existing.isActive,
                status: data.status || existing.status,
                adminNotes: data.adminNotes !== undefined ? data.adminNotes : existing.adminNotes,
            },
        });

        res.json({ success: true, message: 'Mandal updated successfully', data: mandal });
    } catch (error: any) {
        console.error('updateMandal error:', error);
        if (error.code === 'P2002') {
            if (error.meta?.target?.includes('slug')) {
                res.status(400).json({ success: false, message: 'This slug is already in use by another mandal. Please provide a unique slug.' });
                return;
            }
            if (error.meta?.target?.includes('email')) {
                res.status(400).json({ success: false, message: 'This email is already registered with an existing user account.' });
                return;
            }
            if (error.meta?.target?.includes('phone') || error.meta?.target?.includes('contactNumber')) {
                res.status(400).json({ success: false, message: 'This number is already registered with an existing account.' });
                return;
            }
        }
        res.status(500).json({ success: false, message: 'Failed to update mandal', error: error.message });
    }
};

// ─── DELETE MANDAL ───────────────────────────────────────────────────────────
export const deleteMandal = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);

        const existing = await prisma.mandal.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Mandal not found' });
            return;
        }

        await prisma.mandal.delete({ where: { id } });

        res.json({ success: true, message: 'Mandal deleted successfully' });
    } catch (error: any) {
        console.error('deleteMandal error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete mandal', error: error.message });
    }
};

// ─── TOGGLE MANDAL STATUS ────────────────────────────────────────────────────
export const toggleMandalStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const { isActive, status, adminNotes, slug, subdomain, urlType, commissionSlabs } = req.body;

        const existing = await prisma.mandal.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Mandal not found' });
            return;
        }

        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true';
        if (status !== undefined) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        if (slug !== undefined) updateData.slug = slug;

        const mandal = await prisma.$transaction(async (tx) => {
            // Handle commission slabs update
            if (commissionSlabs && Array.isArray(commissionSlabs)) {
                await (tx as any).commissionSlab.deleteMany({
                    where: {
                        targetId: id,
                        slabType: 'MANDAL'
                    }
                });

                if (commissionSlabs.length > 0) {
                    await (tx as any).commissionSlab.createMany({
                        data: commissionSlabs.map((s: any) => ({
                            minAmount: parseFloat(s.minAmount),
                            maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                            platformFee: parseFloat(s.platformFee),
                            percentage: parseFloat(s.percentage),
                            slabType: 'MANDAL',
                            targetId: id,
                            category: s.category || 'MARKETPLACE',
                            isOffline: s.isOffline === true || s.isOffline === 'true',
                            isActive: true
                        }))
                    });
                }
            }

            // If status is APPROVED, create or update Mandal user login account
            if (status === 'APPROVED') {
                const normalizedPhone = normalizePhone(existing.contactNumber);
                const digits = normalizedPhone.replace(/\D/g, '');
                const phoneVariants = [normalizedPhone, digits, existing.contactNumber, '91' + existing.contactNumber, '0' + existing.contactNumber, '+91' + existing.contactNumber];

                let user = await tx.user.findFirst({
                    where: { phone: { in: phoneVariants }, role: 'MANDAL' }
                });

                if (!user) {
                    let nameStr = 'Mandal Admin';
                    try {
                        const nameObj = typeof existing.name === 'string' ? JSON.parse(existing.name) : existing.name;
                        nameStr = existing.presidentName || (nameObj as any).en || (nameObj as any).hi || (nameObj as any).mr || 'Mandal Admin';
                    } catch (e) {
                        if (typeof existing.name === 'string') nameStr = existing.name;
                    }

                    const displayId = await generateCustomId('MNID');
                    user = await tx.user.create({
                        data: {
                            displayId,
                            phone: normalizedPhone,
                            name: nameStr,
                            email: existing.email ? existing.email.toLowerCase().trim() : null,
                            role: 'MANDAL',
                            isVerified: true,
                            isActive: true
                        }
                    });
                } else {
                    // If user exists, ensure they are verified and active, and phone is normalized with +91
                    await tx.user.update({
                        where: { id: user.id },
                        data: { isVerified: true, isActive: true, phone: normalizedPhone }
                    });
                }

                updateData.userId = user.id;
                updateData.contactNumber = normalizedPhone;
            }

            // Sync isActive to the linked User's status
            if (isActive !== undefined && (existing.userId || updateData.userId)) {
                const finalUserId = existing.userId || updateData.userId;
                if (finalUserId) {
                    await tx.user.update({
                        where: { id: finalUserId },
                        data: { isActive: isActive === true || isActive === 'true' }
                    });
                }
            }

            return await tx.mandal.update({ where: { id }, data: updateData });
        });

        res.json({ success: true, message: 'Mandal status updated', data: mandal });
    } catch (error: any) {
        console.error('toggleMandalStatus error:', error);
        if (error.code === 'P2002') {
            if (error.meta?.target?.includes('email')) {
                res.status(400).json({ success: false, message: 'This email is already registered with an existing user account.' });
                return;
            }
            if (error.meta?.target?.includes('phone') || error.meta?.target?.includes('contactNumber')) {
                res.status(400).json({ success: false, message: 'This number is already registered with an existing account.' });
                return;
            }
        }
        res.status(500).json({ success: false, message: 'Failed to update mandal status', error: error.message });
    }
};
