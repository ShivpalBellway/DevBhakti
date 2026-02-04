import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { createShiprocketPickupLocation } from "../../services/shiprocketService";

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
        console.log(`Fetching seller profile for userId: ${userId}`);

        const store = await prisma.sellerProfile.findUnique({
            where: { userId },
            include: { user: { select: { name: true, phone: true } } }
        });

        if (!store) {
            console.log(`Seller profile not found for userId: ${userId}`);
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        console.log(`Seller profile found: ${store.id}`);
        return res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        console.error("Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

export const updateSellerProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const files = req.files as any;
        const data = req.body;

        const store = await prisma.sellerProfile.findUnique({
            where: { userId }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        // Initialize updateData with strictly defined fields from request
        const updateData: any = { updatedAt: new Date() };

        // Helper to add if present
        const fields = [
            'name', 'category', 'openTime', 'description',
            'location', 'fullAddress', 'phone', 'website',
            'bankName', 'accountNumber', 'accountHolderName', 'ifscCode', 'upiId',
            'pickupLocation'
        ];

        fields.forEach(field => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        // Handle files
        const newImage = getFilePath(files, 'image');
        if (newImage) {
            updateData.image = newImage;
        }

        const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : null;
        if (newHeroImages && newHeroImages.length > 0) {
            updateData.heroImages = newHeroImages;
        }

        const updated = await prisma.sellerProfile.update({
            where: { id: store.id },
            data: updateData
        });

        // Automate Shiprocket Sync if address or pickup nickname changed
        if (data.fullAddress || data.pickupLocation) {
            try {
                const pickupData = {
                    pickup_location: updated.pickupLocation || `PICKUP_${updated.id.substring(0, 5)}`,
                    name: updated.name,
                    email: (req as any).user.email || 'seller@devbhakti.in',
                    phone: updated.phone || '+919999999999',
                    address: updated.fullAddress || '',
                    city: updated.location || "Delhi",
                    state: "Delhi",
                    country: "India",
                    pin_code: "110001"
                };
                await createShiprocketPickupLocation(pickupData);

                // If it's a new random nickname, save it
                if (!updated.pickupLocation) {
                    await prisma.sellerProfile.update({
                        where: { id: updated.id },
                        data: { pickupLocation: pickupData.pickup_location }
                    });
                }
            } catch (err) {
                console.error("Seller Shiprocket automation error:", err);
            }
        }

        return res.status(200).json({ success: true, message: "Profile updated successfully", data: updated });
    } catch (error: any) {
        console.error("Update Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
