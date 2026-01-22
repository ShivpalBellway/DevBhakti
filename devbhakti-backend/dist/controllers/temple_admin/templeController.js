"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyTempleProfile = exports.getMyTempleProfile = exports.registerTemple = void 0;
const prisma_1 = require("../../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getFilePath = (files, fieldName) => {
    if (files && files[fieldName] && files[fieldName][0]) {
        return `/uploads/temples/${files[fieldName][0].filename}`;
    }
    return null;
};
const normalizePhone = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    return '+' + cleaned;
};
const getFilePaths = (files, fieldName) => {
    if (files && files[fieldName]) {
        return files[fieldName].map((f) => `/uploads/temples/${f.filename}`);
    }
    return [];
};
const registerTemple = async (req, res) => {
    try {
        const files = req.files;
        const data = req.body;
        // Parse JSON fields safely
        const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
        const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];
        // Normalize Phone
        if (data.phone) {
            data.phone = normalizePhone(data.phone);
        }
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                phone: data.phone,
                role: 'INSTITUTION'
            }
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this phone number already exists' });
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password || '123456', 10);
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Create User (Institution)
            const user = await tx.user.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    password: hashedPassword,
                    role: 'INSTITUTION',
                    isVerified: false, // Pending admin approval
                }
            });
            // 2. Create the Temple linked to the User
            const temple = await tx.temple.create({
                data: {
                    name: data.templeName || 'New Temple',
                    category: data.category || 'Sacred',
                    openTime: data.openTime || '',
                    description: data.description || '',
                    history: data.history || '',
                    location: data.location || '',
                    fullAddress: data.fullAddress || '',
                    phone: data.phone || '',
                    website: data.website,
                    mapUrl: data.mapUrl,
                    viewers: data.viewers,
                    rating: parseFloat(data.rating || '0'),
                    reviewsCount: parseInt(data.reviewsCount || '0'),
                    userId: user.id,
                    liveStatus: false, // Pending admin approval
                    image: getFilePath(files, 'image'),
                    heroImages: getFilePaths(files, 'heroImages'),
                    // Link Poojas
                    poojas: {
                        connect: poojaIds.map((id) => ({ id }))
                    },
                    // Create Inline Events
                    events: {
                        create: inlineEvents.map((ev) => ({
                            name: ev.name,
                            date: ev.date,
                            description: ev.description
                        }))
                    }
                }
            });
            return { user, temple };
        });
        res.status(201).json({
            success: true,
            message: 'Temple registration submitted successfully. Please wait for admin approval.',
            data: result
        });
    }
    catch (error) {
        console.error('Temple registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit registration'
        });
    }
};
exports.registerTemple = registerTemple;
const getMyTempleProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        name: true,
                        phone: true,
                        email: true
                    }
                }
            }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        res.json({ success: true, data: temple });
    }
    catch (error) {
        console.error('Fetch Temple Profile Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyTempleProfile = getMyTempleProfile;
const updateMyTempleProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const files = req.files;
        const data = req.body;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        const updatedTemple = await prisma_1.prisma.temple.update({
            where: { id: temple.id },
            data: {
                name: data.name,
                category: data.category,
                openTime: data.openTime,
                description: data.description,
                history: data.history,
                location: data.location,
                fullAddress: data.fullAddress,
                phone: data.phone,
                website: data.website,
                mapUrl: data.mapUrl,
                viewers: data.viewers,
                image: getFilePath(files, 'image') || undefined,
                heroImages: files && files['heroImages'] ? getFilePaths(files, 'heroImages') : undefined,
            }
        });
        res.json({ success: true, data: updatedTemple, message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error('Update Temple Profile Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateMyTempleProfile = updateMyTempleProfile;
