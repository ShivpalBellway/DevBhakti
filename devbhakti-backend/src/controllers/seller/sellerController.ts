import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getFilePath = (files: any, fieldName: string) => {
    if (files && files[fieldName] && files[fieldName][0]) {
        return `/uploads/products/${files[fieldName][0].filename}`;
    }
    return null;
};

const getFilePaths = (files: any, fieldName: string) => {
    if (files && files[fieldName]) {
        return files[fieldName].map((f: any) => `/uploads/products/${f.filename}`);
    }
    return [];
};

export const getSellerProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const store = await prisma.temple.findUnique({
            where: { userId },
            include: { user: { select: { name: true, phone: true } } }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        return res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        console.error("Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSellerProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const files = req.files as any;
        const data = req.body;

        const store = await prisma.temple.findUnique({
            where: { userId }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        const updateData: any = {
            name: data.name,
            category: data.category,
            openTime: data.openTime,
            description: data.description,
            location: data.location,
            fullAddress: data.fullAddress,
            phone: data.phone,
            website: data.website,
            updatedAt: new Date()
        };

        // Handle files
        const newImage = getFilePath(files, 'image');
        if (newImage) {
            updateData.image = newImage;
        }

        const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : null;
        if (newHeroImages && newHeroImages.length > 0) {
            updateData.heroImages = newHeroImages;
        }

        const updated = await prisma.temple.update({
            where: { id: store.id },
            data: updateData
        });

        return res.status(200).json({ success: true, message: "Profile updated successfully", data: updated });
    } catch (error: any) {
        console.error("Update Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
