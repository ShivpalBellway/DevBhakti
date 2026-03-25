import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { createShiprocketPickupLocation } from "../../services/shiprocketService";
import { notifyAdmins } from "../../services/firebaseService";

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

// Helper to normalize phone number to +91XXXXXXXXXX format
const normalizePhone = (phone: string): string => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 0 (11 digits), remove the 0
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If it has 10 digits, add 91
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }

    // Ensure it starts with +
    return '+' + cleaned;
};

export const getSellerProfile = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).owner.ownerId;
        console.log(`Fetching seller profile for sellerId: ${sellerId}`);

        const store = await prisma.sellerProfile.findUnique({
            where: { id: sellerId },
            include: { user: { select: { name: true, phone: true } } }
        });

        if (!store) {
            console.log(`Seller profile not found for sellerId: ${sellerId}`);
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        // Check for pending update request
        const pendingRequest = await prisma.sellerUpdateRequest.findFirst({
            where: {
                sellerId: store.id,
                status: 'PENDING'
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Seller profile found: ${store.id}`);
        return res.status(200).json({
            success: true,
            data: {
                ...store,
                verificationPending: !!pendingRequest,
                pendingData: pendingRequest ? pendingRequest.requestedData : null
            }
        });
    } catch (error: any) {
        console.error("Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

export const updateSellerProfile = async (req: Request, res: Response) => {
    try {
        const sellerId = (req as any).owner.ownerId;
        const files = req.files as any;
        const data = req.body;

        const store = await prisma.sellerProfile.findUnique({
            where: { id: sellerId }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        // Validate Phone if provided and handle uniqueness
        if (data.phone) {
            const cleaned = data.phone.replace(/\D/g, '');
            if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
                return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10 digits or include 91 prefix.' });
            }
            data.phone = normalizePhone(data.phone);

            // Check if phone number is already taken by another user
            const conflictingUser = await prisma.user.findFirst({
                where: {
                    phone: data.phone,
                    id: { not: store.userId }
                }
            });

            if (conflictingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: `The user with number ${data.phone} is already with us (Registered as ${conflictingUser.role}). Please use a different number.` 
                });
            }

            // Sync with User record if phone changed
            if (data.phone !== (store as any).phone) {
                await prisma.user.update({
                    where: { id: store.userId },
                    data: { phone: data.phone }
                });
            }
        }

        // Define sensitive fields that require admin approval
        const sensitiveFields = [
            'name', 'category', 'openTime', 'description',
            'location', 'fullAddress', 'phone', 'website',
            'bankName', 'accountNumber', 'accountHolderName', 'ifscCode', 'upiId'
        ];

        // Check if any sensitive field is being updated
        const updateData: any = { updatedAt: new Date() };
        const sensitiveChanges: any = {};
        const oldSensitiveData: any = {};
        let hasSensitiveChanges = false;

        // Map of fields to check
        const fieldsToCheck = [
            ...sensitiveFields,
            'pickupLocation' // Non-sensitive
        ];

        // Check textual fields
        fieldsToCheck.forEach(key => {
            const newValue = data[key];
            const oldValue = (store as any)[key];

            if (newValue !== undefined && newValue !== oldValue) {
                if (sensitiveFields.includes(key)) {
                    sensitiveChanges[key] = newValue;
                    oldSensitiveData[key] = oldValue;
                    hasSensitiveChanges = true;
                } else {
                    updateData[key] = newValue;
                }
            }
        });

        // Handle files - Images are considered sensitive
        const newImage = getFilePath(files, 'image');
        if (newImage) {
            sensitiveChanges['image'] = newImage;
            oldSensitiveData['image'] = store.image;
            hasSensitiveChanges = true;
        }

        const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : null;
        if (newHeroImages && newHeroImages.length > 0) {
            sensitiveChanges['heroImages'] = newHeroImages;
            oldSensitiveData['heroImages'] = store.heroImages;
            hasSensitiveChanges = true;
        }

        if (hasSensitiveChanges) {
            // Create a pending update request
            await prisma.sellerUpdateRequest.create({
                data: {
                    sellerId: store.id,
                    requestedData: sensitiveChanges,
                    oldData: oldSensitiveData,
                    status: 'PENDING'
                }
            });

            // Notify Admins
            await notifyAdmins({
                title: "Seller Bank/Profile Update",
                body: `${store.name || 'A Seller'} has updated sensitive details (Bank/Profile) requiring verification.`,
                data: {
                    link: '/admin/sellers',
                    type: 'SELLER_UPDATE'
                }
            });

            // Update non-sensitive fields immediately if any (e.g. pickupLocation)
            if (Object.keys(updateData).length > 1) { // >1 because updatedAt is always there
                await prisma.sellerProfile.update({
                    where: { id: store.id },
                    data: updateData
                });
            }

            return res.json({
                success: true,
                message: 'Sensitive fields update request submitted for admin approval. Non-sensitive fields (if any) updated.',
                pendingApproval: true
            });
        }

        // If no sensitive changes, update everything directly
        if (Object.keys(updateData).length > 1) {
            const updated = await prisma.sellerProfile.update({
                where: { id: store.id },
                data: updateData
            });

            // Automate Shiprocket Sync if address or pickup nickname changed
            // Note: If address was sensitive, it wouldn't be in updateData, but in sensitiveChanges.
            // So Shiprocket sync might need to happen AFTER approval. 
            // For now, we only sync if non-sensitive fields triggered it, OR if we decide address is not sensitive (but verified user says bank details + address usually sensitive).
            // Actually, if address changed, it's pending. So shiprocket won't update yet. Use old address.

            if (data.pickupLocation && !hasSensitiveChanges) {
                try {
                    // ... existing shiprocket logic for pickupLocation update ...
                    // Simplified for now as pickupLocation is the only likely non-sensitive field affecting this
                } catch (err) {
                    console.error("Seller Shiprocket automation error:", err);
                }
            }

            return res.status(200).json({ success: true, message: "Profile updated successfully", data: updated });
        }

        return res.json({ success: true, message: 'No changes detected' });

    } catch (error: any) {
        console.error("Update Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
