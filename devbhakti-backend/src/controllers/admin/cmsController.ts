import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

// Banner Controllers
export const getBanners = async (req: Request, res: Response) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ success: false, message: 'Error fetching banners' });
    }

};

export const createBanner = async (req: Request, res: Response) => {
    try {
        const { link, active, order } = req.body;
        const image = req.file ? `/uploads/cms/banners/${req.file.filename}` : null;


        if (!image) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }


        const banner = await prisma.banner.create({
            data: {
                image,
                link,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
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
        const { link, active, order } = req.body;
        
        const existingBanner = await prisma.banner.findUnique({ where: { id: id as string } });

        if (!existingBanner) return res.status(404).json({ success: false, message: 'Banner not found' });


        let image = existingBanner.image;
        if (req.file) {
            image = `/uploads/cms/banners/${req.file.filename}`;
        }


        const banner = await prisma.banner.update({
            where: { id: id as string },
            data: {

                image,
                link,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.json({ success: true, message: 'Banner updated successfully', data: banner });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ success: false, message: 'Error updating banner' });
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
        const features = await prisma.feature.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: features });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching features' });
    }

};

export const createFeature = async (req: Request, res: Response) => {
    try {
        const { title, description, active, order } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        const image = files['image'] ? `/uploads/cms/features/${files['image'][0].filename}` : null;
        const icon = files['icon'] ? `/uploads/cms/features/${files['icon'][0].filename}` : null;


        if (!image || !icon) {
            return res.status(400).json({ success: false, message: 'Both image and icon are required' });
        }


        const feature = await prisma.feature.create({
            data: {
                title,
                description,
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
        const { title, description, active, order } = req.body;
        
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

                title,
                description,
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
        const testimonials = await prisma.testimonial.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: testimonials });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ success: false, message: 'Error fetching testimonials' });
    }

};

export const createTestimonial = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, category, active, order } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        const thumbnail = files['thumbnail'] ? `/uploads/cms/testimonials/${files['thumbnail'][0].filename}` : null;
        const videoSrc = files['videoSrc'] ? `/uploads/cms/testimonials/${files['videoSrc'][0].filename}` : null;

        if (!thumbnail || !videoSrc) {
            return res.status(400).json({ success: false, message: 'Both thumbnail and video are required' });
        }


        const testimonial = await prisma.testimonial.create({
            data: {
                title,
                subtitle,
                category,
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
        const { title, subtitle, category, active, order } = req.body;
        
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
                title,
                subtitle,
                category,
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
