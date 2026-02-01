import { Request, Response } from "express";
<<<<<<< HEAD
import { prisma } from "../../lib/prisma";
=======
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3

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
<<<<<<< HEAD
        console.log(`Fetching seller profile for userId: ${userId}`);

        const store = await prisma.sellerProfile.findUnique({
=======
        const store = await prisma.temple.findUnique({
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
            where: { userId },
            include: { user: { select: { name: true, phone: true } } }
        });

        if (!store) {
<<<<<<< HEAD
            console.log(`Seller profile not found for userId: ${userId}`);
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        console.log(`Seller profile found: ${store.id}`);
        return res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        console.error("Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message, stack: error.stack });
=======
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        return res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        console.error("Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
    }
};

export const updateSellerProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const files = req.files as any;
        const data = req.body;

<<<<<<< HEAD
        const store = await prisma.sellerProfile.findUnique({
=======
        const store = await prisma.temple.findUnique({
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
            where: { userId }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

<<<<<<< HEAD
        // Initialize updateData with strictly defined fields from request
        const updateData: any = { updatedAt: new Date() };

        // Helper to add if present
        const fields = [
            'name', 'category', 'openTime', 'description',
            'location', 'fullAddress', 'phone', 'website',
            'bankName', 'accountNumber', 'accountHolderName', 'ifscCode', 'upiId'
        ];

        fields.forEach(field => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });
=======
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
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3

        // Handle files
        const newImage = getFilePath(files, 'image');
        if (newImage) {
            updateData.image = newImage;
        }

        const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : null;
        if (newHeroImages && newHeroImages.length > 0) {
            updateData.heroImages = newHeroImages;
        }

<<<<<<< HEAD
        const updated = await prisma.sellerProfile.update({
=======
        const updated = await prisma.temple.update({
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
            where: { id: store.id },
            data: updateData
        });

        return res.status(200).json({ success: true, message: "Profile updated successfully", data: updated });
    } catch (error: any) {
        console.error("Update Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
