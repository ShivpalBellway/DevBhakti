import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

// Banner Controllers
export const getBanners = async (req: Request, res: Response) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(banners);
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ message: 'Error fetching banners', error });
    }
};


export const createBanner = async (req: Request, res: Response) => {
    try {
        const { link, active, order } = req.body;
        const image = req.file ? `/uploads/cms/banners/${req.file.filename}` : null;


        if (!image) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const banner = await prisma.banner.create({
            data: {
                image,
                link,
                active: active === 'true' || active === true,
                order: parseInt(order as string) || 0
            }
        });

        res.status(201).json(banner);
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ message: 'Error creating banner', error });
    }
};


export const updateBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { link, active, order } = req.body;
        
        const existingBanner = await prisma.banner.findUnique({ where: { id: id as string } });

        if (!existingBanner) return res.status(404).json({ message: 'Banner not found' });

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

        res.json(banner);
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ message: 'Error updating banner', error });
    }
};


export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.banner.delete({ where: { id: id as string } });
        res.json({ message: 'Banner deleted successfully' });

    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ message: 'Error deleting banner', error });
    }
};


// Feature Controllers
export const getFeatures = async (req: Request, res: Response) => {
    try {
        const features = await prisma.feature.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(features);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching features', error });
    }
};

export const createFeature = async (req: Request, res: Response) => {
    try {
        const { title, description, active, order } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        const image = files['image'] ? `/uploads/cms/features/${files['image'][0].filename}` : null;
        const icon = files['icon'] ? `/uploads/cms/features/${files['icon'][0].filename}` : null;


        if (!image || !icon) {
            return res.status(400).json({ message: 'Both image and icon are required' });
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

        res.status(201).json(feature);
    } catch (error) {
        console.error('Error creating feature:', error);
        res.status(500).json({ message: 'Error creating feature', error });
    }
};


export const updateFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, active, order } = req.body;
        
        const existingFeature = await prisma.feature.findUnique({ where: { id: id as string } });

        if (!existingFeature) return res.status(404).json({ message: 'Feature not found' });

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

        res.json(feature);
    } catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).json({ message: 'Error updating feature', error });
    }
};


export const deleteFeature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.feature.delete({ where: { id: id as string } });
        res.json({ message: 'Feature deleted successfully' });

    } catch (error) {
        console.error('Error deleting feature:', error);
        res.status(500).json({ message: 'Error deleting feature', error });
    }
};

