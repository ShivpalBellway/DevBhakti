import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildLangJson, buildLangArray, getLang, localize, getEnglish } from '../../utils/localization';

const safeParse = (val: any, fallback: any = []) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return fallback; }
};

// Helper to populate targetDetails for banners
const enrichBannersWithTargetDetails = async (banners: any[]) => {
    if (!banners || banners.length === 0) return [];

    const enriched = await Promise.all(
        banners.map(async (banner) => {
            if (!banner.targetType || banner.targetType === 'NONE' || !banner.targetId) {
                return { ...banner, targetDetails: null };
            }

            let targetDetails: any = null;

            try {
                switch (banner.targetType) {
                    case 'POOJA': {
                        const pooja = await prisma.pooja.findUnique({
                            where: { id: banner.targetId },
                            select: { id: true, name: true, image: true, price: true, slug: true }
                        });
                        if (pooja) {
                            targetDetails = {
                                id: pooja.id,
                                name: getEnglish(pooja.name) || (typeof pooja.name === 'string' ? pooja.name : ''),
                                image: pooja.image,
                                price: pooja.price,
                                slug: pooja.slug
                            };
                        }
                        break;
                    }
                    case 'TEMPLE': {
                        const temple = await prisma.temple.findUnique({
                            where: { id: banner.targetId },
                            select: { id: true, name: true, image: true, location: true, slug: true }
                        });
                        if (temple) {
                            targetDetails = {
                                id: temple.id,
                                name: getEnglish(temple.name) || (typeof temple.name === 'string' ? temple.name : ''),
                                image: temple.image,
                                location: getEnglish(temple.location) || (typeof temple.location === 'string' ? temple.location : ''),
                                slug: temple.slug
                            };
                        }
                        break;
                    }
                    case 'PRODUCT': {
                        const product = await prisma.product.findUnique({
                            where: { id: banner.targetId },
                            include: {
                                variants: { select: { price: true, image: true } }
                            }
                        });
                        if (product) {
                            const rawImages = (product as any).images;
                            const images = safeParse(rawImages, []);
                            const firstImage = (Array.isArray(images) && images.length > 0) ? images[0] : (product.variants?.[0]?.image || null);
                            targetDetails = {
                                id: product.id,
                                name: getEnglish(product.name) || (typeof product.name === 'string' ? product.name : ''),
                                image: firstImage,
                                price: product.variants?.[0]?.price || null,
                                slug: null
                            };
                        }
                        break;
                    }
                    case 'MANDAL': {
                        const mandal = await prisma.mandal.findUnique({
                            where: { id: banner.targetId },
                            select: { id: true, name: true, image: true, city: true, state: true, slug: true }
                        });
                        if (mandal) {
                            targetDetails = {
                                id: mandal.id,
                                name: getEnglish(mandal.name) || (typeof mandal.name === 'string' ? mandal.name : ''),
                                image: mandal.image,
                                location: mandal.city && mandal.state ? `${mandal.city}, ${mandal.state}` : (mandal.city || mandal.state || ''),
                                slug: mandal.slug
                            };
                        }
                        break;
                    }
                    case 'CONTEST': {
                        const campaign = await prisma.campaign.findUnique({
                            where: { id: banner.targetId },
                            select: { id: true, title: true, name: true, bannerImage: true, slug: true }
                        });
                        if (campaign) {
                            targetDetails = {
                                id: campaign.id,
                                name: campaign.title || getEnglish(campaign.name) || campaign.name || '',
                                image: campaign.bannerImage,
                                slug: campaign.slug
                            };
                        }
                        break;
                    }
                }
            } catch (e) {
                console.error(`Error populating targetDetails for banner ${banner.id}:`, e);
            }

            return {
                ...banner,
                targetDetails
            };
        })
    );

    return enriched;
};

// Banner Controllers
export const getBanners = async (req: Request, res: Response) => {
    try {
        const lang = getLang(req);
        // If ?page=all or lang=raw → return ALL banners for admin management table
        // If ?page=slug → return page-specific banners
        // If no page param (homepage) → return global banners (targetPage is null)
        const targetPage = req.query.page as string | undefined;

        const whereClause: any = {
            NOT: { id: "GLOBAL_SECTION_toggle" },
            ...(lang !== 'raw' ? { active: true } : {}),
        };

        if (targetPage === 'all' || lang === 'raw') {
            // Return all banners for Admin CMS Table
        } else if (targetPage) {
            whereClause.targetPage = targetPage;
        } else {
            whereClause.targetPage = null;
        }

        const banners = await prisma.banner.findMany({
            where: whereClause,
            orderBy: { order: 'asc' }
        });

        const localizedBanners = localize(banners, lang);
        const enrichedBanners = await enrichBannersWithTargetDetails(localizedBanners);

        res.json({ success: true, data: enrichedBanners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ success: false, message: 'Error fetching banners' });
    }
};

export const getBannerTargets = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        let items: any[] = [];

        switch (type) {
            case 'POOJA': {
                const poojas = await prisma.pooja.findMany({
                    where: { status: true },
                    select: { id: true, name: true, slug: true }
                });
                items = poojas.map(p => ({
                    id: p.id,
                    name: getEnglish(p.name) || (typeof p.name === 'string' ? p.name : 'Unnamed Pooja'),
                    slug: p.slug
                }));
                break;
            }
            case 'TEMPLE': {
                const temples = await prisma.temple.findMany({
                    where: {
                        isActive: true,
                        user: { isVerified: true }
                    },
                    select: { id: true, name: true, slug: true }
                });
                items = temples.map(t => ({
                    id: t.id,
                    name: getEnglish(t.name) || (typeof t.name === 'string' ? t.name : 'Unnamed Temple'),
                    slug: t.slug
                }));
                break;
            }
            case 'PRODUCT': {
                const products = await prisma.product.findMany({
                    select: { id: true, name: true }
                });
                items = products.map(pr => ({
                    id: pr.id,
                    name: getEnglish(pr.name) || (typeof pr.name === 'string' ? pr.name : 'Unnamed Product'),
                    slug: null
                }));
                break;
            }
            case 'MANDAL': {
                const mandals = await prisma.mandal.findMany({
                    where: { isActive: true, status: 'APPROVED' },
                    select: { id: true, name: true, slug: true }
                });
                items = mandals.map(m => ({
                    id: m.id,
                    name: getEnglish(m.name) || (typeof m.name === 'string' ? m.name : 'Unnamed Mandal'),
                    slug: m.slug
                }));
                break;
            }
            case 'CONTEST': {
                const campaigns = await prisma.campaign.findMany({
                    where: { isActive: true },
                    select: { id: true, title: true, name: true, slug: true }
                });
                items = campaigns.map(c => ({
                    id: c.id,
                    name: c.title || getEnglish(c.name) || c.name || c.slug,
                    slug: c.slug
                }));
                break;
            }
            default:
                items = [];
                break;
        }

        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error fetching banner targets:', error);
        res.status(500).json({ success: false, message: 'Error fetching banner targets' });
    }
};

export const createBanner = async (req: Request, res: Response) => {
    try {
        const { active, order, targetPage, targetType, targetId, targetSlug, customUrl } = req.body;
        const image = req.file ? `/uploads/cms/banners/${req.file.filename}` : null;

        if (!image) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        const banner = await prisma.banner.create({
            data: {
                image,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0,
                targetPage: targetPage && targetPage !== 'global' ? targetPage : null,
                targetType: (targetType || 'NONE') as any,
                targetId: targetId || null,
                targetSlug: targetSlug || null,
                customUrl: customUrl || null,
            } as any
        });

        res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ success: false, message: 'Error creating banner' });
    }
};

export const updateBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { active, order, targetPage, targetType, targetId, targetSlug, customUrl } = req.body;

        const existingBanner: any = await prisma.banner.findUnique({ where: { id: id as string } });
        if (!existingBanner) return res.status(404).json({ success: false, message: 'Banner not found' });

        let image = existingBanner.image;
        if (req.file) {
            image = `/uploads/cms/banners/${req.file.filename}`;
        }

        const banner = await prisma.banner.update({
            where: { id: id as string },
            data: {
                image,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0,
                targetPage: targetPage !== undefined
                    ? (targetPage && targetPage !== 'global' ? targetPage : null)
                    : existingBanner.targetPage,
                targetType: targetType !== undefined ? targetType : existingBanner.targetType,
                targetId: targetId !== undefined ? targetId : existingBanner.targetId,
                targetSlug: targetSlug !== undefined ? targetSlug : existingBanner.targetSlug,
                customUrl: customUrl !== undefined ? customUrl : existingBanner.customUrl,
            } as any
        });

        res.json({ success: true, message: 'Banner updated successfully', data: banner });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ success: false, message: 'Error updating banner' });
    }
};

export const getBannerGlobalStatus = async (req: Request, res: Response) => {
    try {
        const statusRecord = await prisma.banner.findUnique({
            where: { id: "GLOBAL_SECTION_toggle" }
        });

        res.json({
            success: true,
            active: statusRecord ? statusRecord.active : true // Default to true if not exists
        });
    } catch (error) {
        console.error('Error fetching banner global status:', error);
        res.status(500).json({ success: false, message: 'Error fetching global status' });
    }
};

export const toggleBannerGlobalStatus = async (req: Request, res: Response) => {
    try {
        const statusRecord = await prisma.banner.findUnique({
            where: { id: "GLOBAL_SECTION_toggle" }
        });

        const currentStatus = statusRecord ? statusRecord.active : true;

        const updated = await prisma.banner.upsert({
            where: { id: "GLOBAL_SECTION_toggle" },
            update: { active: !currentStatus },
            create: {
                id: "GLOBAL_SECTION_toggle",
                image: "SYSTEM", // Placeholder
                active: !currentStatus,
                order: -1
            }
        });

        res.json({ success: true, active: updated.active });
    } catch (error) {
        console.error('Error toggling banner global status:', error);
        res.status(500).json({ success: false, message: 'Error toggling global status' });
    }
};

export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.banner.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ success: false, message: 'Error deleting banner' });
    }

};

// Feature Controllers
export const getFeatures = async (req: Request, res: Response) => {
    try {
        const lang = getLang(req);
        const features = await prisma.feature.findMany({
            where: (lang !== 'raw' ? { active: true } : {}),
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: localize(features, lang) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching features' });
    }

};

export const createFeature = async (req: Request, res: Response) => {
    try {
        const { 
            title_en, title_hi, title_mr,
            description_en, description_hi, description_mr,
            active, order 
        } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const image = files['image'] ? `/uploads/cms/features/${files['image'][0].filename}` : null;
        const icon = files['icon'] ? `/uploads/cms/features/${files['icon'][0].filename}` : null;

        const final_title_en = title_en || req.body.title;

        if (!final_title_en || !image || !icon) {
            return res.status(400).json({ success: false, message: 'Title (English), image and icon are required' });
        }


        const feature = await prisma.feature.create({
            data: {
                title: buildLangJson(final_title_en, title_hi, title_mr),
                description: buildLangJson(description_en || req.body.description, description_hi, description_mr),
                image,
                icon,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.status(201).json({ success: true, message: 'Feature created successfully', data: feature });
    } catch (error) {
        console.error('Error creating feature:', error);
        res.status(500).json({ success: false, message: 'Error creating feature' });
    }

};

export const updateFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            title_en, title_hi, title_mr,
            description_en, description_hi, description_mr,
            active, order 
        } = req.body;

        const existingFeature = await prisma.feature.findUnique({ where: { id: id as string } });

        if (!existingFeature) return res.status(404).json({ success: false, message: 'Feature not found' });


        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        let image = existingFeature.image;
        if (files && files['image']) {
            image = `/uploads/cms/features/${files['image'][0].filename}`;
        }

        let icon = existingFeature.icon;
        if (files && files['icon']) {
            icon = `/uploads/cms/features/${files['icon'][0].filename}`;
        }


        const feature = await prisma.feature.update({
            where: { id: id as string },
            data: {
                title: buildLangJson(title_en || req.body.title, title_hi, title_mr),
                description: buildLangJson(description_en || req.body.description, description_hi, description_mr),
                image,
                icon,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.json({ success: true, message: 'Feature updated successfully', data: feature });
    } catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).json({ success: false, message: 'Error updating feature' });
    }

};

export const deleteFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.feature.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Feature deleted successfully' });
    } catch (error) {
        console.error('Error deleting feature:', error);
        res.status(500).json({ success: false, message: 'Error deleting feature' });
    }

};

// Testimonial Controllers
export const getTestimonials = async (req: Request, res: Response) => {
    try {
        const lang = getLang(req);
        const testimonials = await prisma.testimonial.findMany({
            where: (lang !== 'raw' ? { active: true } : {}),
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: localize(testimonials, lang) });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ success: false, message: 'Error fetching testimonials' });
    }

};

export const createTestimonial = async (req: Request, res: Response) => {
    try {
        const { 
            title_en, title_hi, title_mr,
            subtitle_en, subtitle_hi, subtitle_mr,
            category_en, category_hi, category_mr,
            active, order 
        } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const thumbnail = files['thumbnail'] ? `/uploads/cms/testimonials/${files['thumbnail'][0].filename}` : null;
        const videoSrc = files['videoSrc'] ? `/uploads/cms/testimonials/${files['videoSrc'][0].filename}` : null;

        const final_title_en = title_en || req.body.title;

        if (!final_title_en || !thumbnail || !videoSrc) {
            return res.status(400).json({ success: false, message: 'Title (English), thumbnail and video are required' });
        }


        const testimonial = await prisma.testimonial.create({
            data: {
                title: buildLangJson(final_title_en, title_hi, title_mr),
                subtitle: buildLangJson(subtitle_en || req.body.subtitle, subtitle_hi, subtitle_mr),
                category: buildLangJson(category_en || req.body.category, category_hi, category_mr),
                thumbnail,
                videoSrc,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.status(201).json({ success: true, message: 'Testimonial created successfully', data: testimonial });
    } catch (error) {
        console.error('Error creating testimonial:', error);
        res.status(500).json({ success: false, message: 'Error creating testimonial' });
    }

};

export const updateTestimonial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            title_en, title_hi, title_mr,
            subtitle_en, subtitle_hi, subtitle_mr,
            category_en, category_hi, category_mr,
            active, order 
        } = req.body;

        const existingTestimonial = await prisma.testimonial.findUnique({ where: { id: id as string } });
        if (!existingTestimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });


        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        let thumbnail = existingTestimonial.thumbnail;
        if (files && files['thumbnail']) {
            thumbnail = `/uploads/cms/testimonials/${files['thumbnail'][0].filename}`;
        }

        let videoSrc = existingTestimonial.videoSrc;
        if (files && files['videoSrc']) {
            videoSrc = `/uploads/cms/testimonials/${files['videoSrc'][0].filename}`;
        }

        const testimonial = await prisma.testimonial.update({
            where: { id: id as string },
            data: {
                title: buildLangJson(title_en || req.body.title, title_hi, title_mr),
                subtitle: buildLangJson(subtitle_en || req.body.subtitle, subtitle_hi, subtitle_mr),
                category: buildLangJson(category_en || req.body.category, category_hi, category_mr),
                thumbnail,
                videoSrc,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.json({ success: true, message: 'Testimonial updated successfully', data: testimonial });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({ success: false, message: 'Error updating testimonial' });
    }

};

export const deleteTestimonial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.testimonial.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Testimonial deleted successfully' });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ success: false, message: 'Error deleting testimonial' });
    }

};

// CTA Card Controllers
export const getCTACards = async (req: Request, res: Response) => {
    try {
        const lang = getLang(req);
        const ctaCards = await prisma.cTACard.findMany({
            where: (lang !== 'raw' ? { active: true } : {}),
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: localize(ctaCards, lang) });
    } catch (error) {
        console.error('Error fetching CTA cards:', error);
        res.status(500).json({ error: 'Failed to fetch CTA cards' });
    }
};

export const createCTACard = async (req: Request, res: Response) => {
    try {
        const { 
            title_en, title_hi, title_mr,
            points_en, points_hi, points_mr,
            buttonText_en, buttonText_hi, buttonText_mr,
            buttonLink, cardType, active, order 
        } = req.body;
        const icon = req.file ? `/uploads/cms/cta/${req.file.filename}` : null;

        const final_title_en = title_en || req.body.title;

        if (!icon) {
            return res.status(400).json({ success: false, message: 'Icon is required' });
        }

        const parsePoints = (p: any) => {
            if (!p) return [];
            if (typeof p === 'string') {
                try {
                    return JSON.parse(p);
                } catch (e) {
                    return [p];
                }
            }
            return p;
        };

        const ctaCard = await prisma.cTACard.create({
            data: {
                title: buildLangJson(final_title_en, title_hi, title_mr),
                points: buildLangArray(
                    safeParse(points_en || req.body.points),
                    safeParse(points_hi),
                    safeParse(points_mr)
                ),
                icon,
                buttonText: buildLangJson(buttonText_en || req.body.buttonText || 'Learn More', buttonText_hi, buttonText_mr),
                buttonLink,
                cardType,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.status(201).json({ success: true, data: ctaCard });
    } catch (error) {
        console.error('Error creating CTA card:', error);
        res.status(500).json({ success: false, message: 'Failed to create CTA card', error: error instanceof Error ? error.message : String(error) });
    }
};

export const updateCTACard = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            title_en, title_hi, title_mr,
            points_en, points_hi, points_mr,
            buttonText_en, buttonText_hi, buttonText_mr,
            buttonLink, cardType, active, order 
        } = req.body;

        const existingCard = await prisma.cTACard.findUnique({ where: { id: id as string } });
        if (!existingCard) {
            return res.status(404).json({ success: false, message: 'CTA card not found' });
        }

        let icon = existingCard.icon;
        if (req.file) {
            icon = `/uploads/cms/cta/${req.file.filename}`;
        }

        const parsePoints = (p: any) => {
            if (p === undefined) return undefined;
            if (!p) return [];
            if (typeof p === 'string') {
                try {
                    return JSON.parse(p);
                } catch (e) {
                    return [p];
                }
            }
            return p;
        };

        const ctaCard = await prisma.cTACard.update({
            where: { id: id as string },
            data: {
                title: buildLangJson(title_en || req.body.title, title_hi, title_mr),
                points: buildLangArray(
                    safeParse(points_en || req.body.points),
                    safeParse(points_hi),
                    safeParse(points_mr)
                ),
                icon,
                buttonText: buildLangJson(buttonText_en || req.body.buttonText, buttonText_hi, buttonText_mr),
                buttonLink,
                cardType,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.json({ success: true, data: ctaCard });
    } catch (error) {
        console.error('Error updating CTA card (INTERNAL ERROR):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update CTA card',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const deleteCTACard = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existingCard = await prisma.cTACard.findUnique({ where: { id: id as string } });
        if (!existingCard) {
            return res.status(404).json({ error: 'CTA card not found' });
        }

        await prisma.cTACard.delete({ where: { id: id as string } });

        res.json({ success: true, message: 'CTA card deleted successfully' });
    } catch (error) {
        console.error('Error deleting CTA card:', error);
        res.status(500).json({ error: 'Failed to delete CTA card' });
    }
};

// Standard FAQ Controllers
export const getStandardFAQs = async (req: Request, res: Response) => {
    try {
        const lang = getLang(req);
        const faqs = await prisma.standardFAQ.findMany({
            where: (lang !== 'raw' ? { isActive: true } : {}),
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: localize(faqs, lang) });
    } catch (error) {
        console.error('Error fetching standard FAQs:', error);
        res.status(500).json({ success: false, message: 'Error fetching standard FAQs' });
    }
};

export const createStandardFAQ = async (req: Request, res: Response) => {
    try {
        const { question_en, question_hi, question_mr, answer_en, answer_hi, answer_mr, order, isActive } = req.body;
        
        const faq = await prisma.standardFAQ.create({
            data: {
                question: buildLangJson(question_en, question_hi, question_mr),
                answer: buildLangJson(answer_en, answer_hi, answer_mr),
                order: parseInt(order as string) || 0,
                isActive: isActive === 'true' || isActive === true
            }
        });
        
        res.status(201).json({ success: true, message: 'Standard FAQ created successfully', data: faq });
    } catch (error) {
        console.error('Error creating standard FAQ:', error);
        res.status(500).json({ success: false, message: 'Error creating standard FAQ' });
    }
};

export const updateStandardFAQ = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { question_en, question_hi, question_mr, answer_en, answer_hi, answer_mr, order, isActive } = req.body;
        
        const faq = await prisma.standardFAQ.update({
            where: { id: id as string },
            data: {
                question: buildLangJson(question_en, question_hi, question_mr),
                answer: buildLangJson(answer_en, answer_hi, answer_mr),
                order: parseInt(order as string) || 0,
                isActive: isActive === 'true' || isActive === true
            }
        });
        
        res.json({ success: true, message: 'Standard FAQ updated successfully', data: faq });
    } catch (error) {
        console.error('Error updating standard FAQ:', error);
        res.status(500).json({ success: false, message: 'Error updating standard FAQ' });
    }
};

export const deleteStandardFAQ = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.standardFAQ.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Standard FAQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting standard FAQ:', error);
        res.status(500).json({ success: false, message: 'Error deleting standard FAQ' });
    }
};

