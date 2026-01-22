"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCTACard = exports.updateCTACard = exports.createCTACard = exports.getCTACards = exports.deleteTestimonial = exports.updateTestimonial = exports.createTestimonial = exports.getTestimonials = exports.deleteFeature = exports.updateFeature = exports.createFeature = exports.getFeatures = exports.deleteBanner = exports.updateBanner = exports.createBanner = exports.getBanners = void 0;
const prisma_1 = require("../../lib/prisma");
// Banner Controllers
const getBanners = async (req, res) => {
    try {
        const banners = await prisma_1.prisma.banner.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: banners });
    }
    catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ success: false, message: 'Error fetching banners' });
    }
};
exports.getBanners = getBanners;
const createBanner = async (req, res) => {
    try {
        const { link, active, order } = req.body;
        const image = req.file ? `/uploads/cms/banners/${req.file.filename}` : null;
        if (!image) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }
        const banner = await prisma_1.prisma.banner.create({
            data: {
                image,
                link,
                active: active === 'true' || active === true,
                order: parseInt(order) || 0
            }
        });
        res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
    }
    catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ success: false, message: 'Error creating banner' });
    }
};
exports.createBanner = createBanner;
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { link, active, order } = req.body;
        const existingBanner = await prisma_1.prisma.banner.findUnique({ where: { id: id } });
        if (!existingBanner)
            return res.status(404).json({ success: false, message: 'Banner not found' });
        let image = existingBanner.image;
        if (req.file) {
            image = `/uploads/cms/banners/${req.file.filename}`;
        }
        const banner = await prisma_1.prisma.banner.update({
            where: { id: id },
            data: {
                image,
                link,
                active: active === 'true' || active === true,
                order: parseInt(order) || 0
            }
        });
        res.json({ success: true, message: 'Banner updated successfully', data: banner });
    }
    catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ success: false, message: 'Error updating banner' });
    }
};
exports.updateBanner = updateBanner;
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.banner.delete({ where: { id: id } });
        res.json({ success: true, message: 'Banner deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ success: false, message: 'Error deleting banner' });
    }
};
exports.deleteBanner = deleteBanner;
// Feature Controllers
const getFeatures = async (req, res) => {
    try {
        const features = await prisma_1.prisma.feature.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: features });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching features' });
    }
};
exports.getFeatures = getFeatures;
const createFeature = async (req, res) => {
    try {
        const { title, description, active, order } = req.body;
        const files = req.files;
        const image = files['image'] ? `/uploads/cms/features/${files['image'][0].filename}` : null;
        const icon = files['icon'] ? `/uploads/cms/features/${files['icon'][0].filename}` : null;
        if (!image || !icon) {
            return res.status(400).json({ success: false, message: 'Both image and icon are required' });
        }
        const feature = await prisma_1.prisma.feature.create({
            data: {
                title,
                description,
                image,
                icon,
                active: active === 'true' || active === true,
                order: parseInt(order) || 0
            }
        });
        res.status(201).json({ success: true, message: 'Feature created successfully', data: feature });
    }
    catch (error) {
        console.error('Error creating feature:', error);
        res.status(500).json({ success: false, message: 'Error creating feature' });
    }
};
exports.createFeature = createFeature;
const updateFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, active, order } = req.body;
        const existingFeature = await prisma_1.prisma.feature.findUnique({ where: { id: id } });
        if (!existingFeature)
            return res.status(404).json({ success: false, message: 'Feature not found' });
        const files = req.files;
        let image = existingFeature.image;
        if (files && files['image']) {
            image = `/uploads/cms/features/${files['image'][0].filename}`;
        }
        let icon = existingFeature.icon;
        if (files && files['icon']) {
            icon = `/uploads/cms/features/${files['icon'][0].filename}`;
        }
        const feature = await prisma_1.prisma.feature.update({
            where: { id: id },
            data: {
                title,
                description,
                image,
                icon,
                active: active === 'true' || active === true,
                order: parseInt(order) || 0
            }
        });
        res.json({ success: true, message: 'Feature updated successfully', data: feature });
    }
    catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).json({ success: false, message: 'Error updating feature' });
    }
};
exports.updateFeature = updateFeature;
const deleteFeature = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.feature.delete({ where: { id: id } });
        res.json({ success: true, message: 'Feature deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting feature:', error);
        res.status(500).json({ success: false, message: 'Error deleting feature' });
    }
};
exports.deleteFeature = deleteFeature;
// Testimonial Controllers
const getTestimonials = async (req, res) => {
    try {
        const testimonials = await prisma_1.prisma.testimonial.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: testimonials });
    }
    catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ success: false, message: 'Error fetching testimonials' });
    }
};
exports.getTestimonials = getTestimonials;
const createTestimonial = async (req, res) => {
    try {
        const { title, subtitle, category, active, order } = req.body;
        const files = req.files;
        const thumbnail = files['thumbnail'] ? `/uploads/cms/testimonials/${files['thumbnail'][0].filename}` : null;
        const videoSrc = files['videoSrc'] ? `/uploads/cms/testimonials/${files['videoSrc'][0].filename}` : null;
        if (!thumbnail || !videoSrc) {
            return res.status(400).json({ success: false, message: 'Both thumbnail and video are required' });
        }
        const testimonial = await prisma_1.prisma.testimonial.create({
            data: {
                title,
                subtitle,
                category,
                thumbnail,
                videoSrc,
                active: active === 'true' || active === true,
                order: parseInt(order) || 0
            }
        });
        res.status(201).json({ success: true, message: 'Testimonial created successfully', data: testimonial });
    }
    catch (error) {
        console.error('Error creating testimonial:', error);
        res.status(500).json({ success: false, message: 'Error creating testimonial' });
    }
};
exports.createTestimonial = createTestimonial;
const updateTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, category, active, order } = req.body;
        const existingTestimonial = await prisma_1.prisma.testimonial.findUnique({ where: { id: id } });
        if (!existingTestimonial)
            return res.status(404).json({ success: false, message: 'Testimonial not found' });
        const files = req.files;
        let thumbnail = existingTestimonial.thumbnail;
        if (files && files['thumbnail']) {
            thumbnail = `/uploads/cms/testimonials/${files['thumbnail'][0].filename}`;
        }
        let videoSrc = existingTestimonial.videoSrc;
        if (files && files['videoSrc']) {
            videoSrc = `/uploads/cms/testimonials/${files['videoSrc'][0].filename}`;
        }
        const testimonial = await prisma_1.prisma.testimonial.update({
            where: { id: id },
            data: {
                title,
                subtitle,
                category,
                thumbnail,
                videoSrc,
                active: active === 'true' || active === true,
                order: parseInt(order) || 0
            }
        });
        res.json({ success: true, message: 'Testimonial updated successfully', data: testimonial });
    }
    catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({ success: false, message: 'Error updating testimonial' });
    }
};
exports.updateTestimonial = updateTestimonial;
const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.testimonial.delete({ where: { id: id } });
        res.json({ success: true, message: 'Testimonial deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ success: false, message: 'Error deleting testimonial' });
    }
};
exports.deleteTestimonial = deleteTestimonial;
// CTA Card Controllers
const getCTACards = async (req, res) => {
    try {
        const ctaCards = await prisma_1.prisma.cTACard.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: ctaCards });
    }
    catch (error) {
        console.error('Error fetching CTA cards:', error);
        res.status(500).json({ error: 'Failed to fetch CTA cards' });
    }
};
exports.getCTACards = getCTACards;
const createCTACard = async (req, res) => {
    try {
        const { title, points, icon, buttonText, buttonLink, cardType, active, order } = req.body;
        const ctaCard = await prisma_1.prisma.cTACard.create({
            data: {
                title,
                points,
                icon,
                buttonText,
                buttonLink,
                cardType,
                active: active ?? true,
                order: order ?? 0
            }
        });
        res.status(201).json({ success: true, data: ctaCard });
    }
    catch (error) {
        console.error('Error creating CTA card:', error);
        res.status(500).json({ error: 'Failed to create CTA card' });
    }
};
exports.createCTACard = createCTACard;
const updateCTACard = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, points, icon, buttonText, buttonLink, cardType, active, order } = req.body;
        const existingCard = await prisma_1.prisma.cTACard.findUnique({ where: { id: id } });
        if (!existingCard) {
            return res.status(404).json({ error: 'CTA card not found' });
        }
        const ctaCard = await prisma_1.prisma.cTACard.update({
            where: { id: id },
            data: {
                title,
                points,
                icon,
                buttonText,
                buttonLink,
                cardType,
                active,
                order
            }
        });
        res.json({ success: true, data: ctaCard });
    }
    catch (error) {
        console.error('Error updating CTA card:', error);
        res.status(500).json({ error: 'Failed to update CTA card' });
    }
};
exports.updateCTACard = updateCTACard;
const deleteCTACard = async (req, res) => {
    try {
        const { id } = req.params;
        const existingCard = await prisma_1.prisma.cTACard.findUnique({ where: { id: id } });
        if (!existingCard) {
            return res.status(404).json({ error: 'CTA card not found' });
        }
        await prisma_1.prisma.cTACard.delete({ where: { id: id } });
        res.json({ success: true, message: 'CTA card deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting CTA card:', error);
        res.status(500).json({ error: 'Failed to delete CTA card' });
    }
};
exports.deleteCTACard = deleteCTACard;
