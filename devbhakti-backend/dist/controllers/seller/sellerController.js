"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSellerProfile = exports.getSellerProfile = void 0;
const prisma_1 = require("../../lib/prisma");
const getFilePath = (files, fieldName) => {
    if (files && files[fieldName] && files[fieldName][0]) {
        return `/uploads/products/${files[fieldName][0].filename}`;
    }
    return null;
};
const getFilePaths = (files, fieldName) => {
    if (files && files[fieldName]) {
        return files[fieldName].map((f) => `/uploads/products/${f.filename}`);
    }
    return [];
};
const getSellerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`Fetching seller profile for userId: ${userId}`);
        const store = await prisma_1.prisma.sellerProfile.findUnique({
            where: { userId },
            include: { user: { select: { name: true, phone: true } } }
        });
        if (!store) {
            console.log(`Seller profile not found for userId: ${userId}`);
            return res.status(404).json({ success: false, message: "Store not found" });
        }
        console.log(`Seller profile found: ${store.id}`);
        return res.status(200).json({ success: true, data: store });
    }
    catch (error) {
        console.error("Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};
exports.getSellerProfile = getSellerProfile;
const updateSellerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const files = req.files;
        const data = req.body;
        const store = await prisma_1.prisma.sellerProfile.findUnique({
            where: { userId }
        });
        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }
        // Initialize updateData with strictly defined fields from request
        const updateData = { updatedAt: new Date() };
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
        // Handle files
        const newImage = getFilePath(files, 'image');
        if (newImage) {
            updateData.image = newImage;
        }
        const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : null;
        if (newHeroImages && newHeroImages.length > 0) {
            updateData.heroImages = newHeroImages;
        }
        const updated = await prisma_1.prisma.sellerProfile.update({
            where: { id: store.id },
            data: updateData
        });
        return res.status(200).json({ success: true, message: "Profile updated successfully", data: updated });
    }
    catch (error) {
        console.error("Update Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSellerProfile = updateSellerProfile;
