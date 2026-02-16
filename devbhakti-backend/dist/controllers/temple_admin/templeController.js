"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTempleDevotees = exports.updateMyTempleProfile = exports.getMyTempleProfile = exports.registerTemple = void 0;
const prisma_1 = require("../../lib/prisma");
const shiprocketService_1 = require("../../services/shiprocketService");
const shiprocketUtils_1 = require("../../lib/shiprocketUtils");
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
            const cleaned = data.phone.replace(/\D/g, '');
            // Allow 10 digits OR 12 digits if starting with 91
            if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
                return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits' });
            }
            data.phone = normalizePhone(data.phone);
        }
        // Image validations (2MB)
        const MAX_SIZE = 2 * 1024 * 1024;
        if (files) {
            if (files.heroImages && files.heroImages.length > 5) {
                return res.status(400).json({ success: false, message: 'Maximum 5 banner images allowed' });
            }
            const allFiles = [...(files.image || []), ...(files.heroImages || []), ...(files.gallery || [])];
            for (const file of allFiles) {
                if (file.size > MAX_SIZE) {
                    return res.status(400).json({ success: false, message: `Image ${file.originalname} is too large. Max 2MB allowed.` });
                }
            }
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
            const templeId = `TMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const temple = await tx.temple.create({
                data: {
                    templeId: templeId,
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
                    },
                    pickupLocation: `TEMPLE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                }
            });
            return { user, temple };
        });
        // 3. Register Pickup Location with Shiprocket
        try {
            const { city, state } = (0, shiprocketUtils_1.parseLocation)(data.location || "");
            const pincode = (0, shiprocketUtils_1.extractPincode)(data.fullAddress || "");
            const pickupData = {
                pickup_location: result.temple.pickupLocation,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.fullAddress || '',
                city: city || "Delhi",
                state: state || "Delhi",
                country: "India",
                pin_code: pincode || "110001"
            };
            await (0, shiprocketService_1.createShiprocketPickupLocation)(pickupData);
        }
        catch (srError) {
            console.error("Shiprocket Pickup sync error:", srError);
        }
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
    console.log("Fetching temple profile for user...");
    try {
        const userId = req.user?.userId;
        if (!userId) {
            console.error("No userId found in request - Authentication failure suspected");
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        }
        console.log(`Searching temple for userId: ${userId}`);
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
            console.log(`No temple found for userId: ${userId}`);
            return res.status(200).json({ success: false, message: 'Temple record not found for this account. Please register your temple.' });
        }
        console.log("Temple profile fetched successfully");
        res.json({ success: true, data: temple });
    }
    catch (error) {
        console.error('Fetch Temple Profile Error:', error);
        res.status(500).json({ success: false, message: `Server error: ${error.message}` });
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
        // Validate Phone if provided
        if (data.phone) {
            const cleaned = data.phone.replace(/\D/g, '');
            // Allow 10 digits OR 12 digits if starting with 91
            if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
                return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits' });
            }
            data.phone = normalizePhone(data.phone);
        }
        // Image size validations (2MB for NEW files)
        const MAX_SIZE = 2 * 1024 * 1024;
        if (files) {
            const newHeroImagesCount = files.heroImages ? files.heroImages.length : 0;
            const currentHeroImagesCount = temple.heroImages ? temple.heroImages.length : 0;
            const totalHeroImages = currentHeroImagesCount + newHeroImagesCount;
            if (totalHeroImages > 5) {
                return res.status(400).json({ success: false, message: `Maximum 5 banners allowed. You already have ${currentHeroImagesCount} and tried to add ${newHeroImagesCount}.` });
            }
            const allFiles = [...(files.image || []), ...(files.heroImages || []), ...(files.gallery || [])];
            for (const file of allFiles) {
                if (file.size > MAX_SIZE) {
                    return res.status(400).json({ success: false, message: `Image ${file.originalname} is too large. Max 2MB allowed.` });
                }
            }
        }
        // Define sensitive fields
        const sensitiveFields = [
            'name', 'location', 'category', 'fullAddress', 'image', 'heroImages', 'gallery',
            'accountHolderName', 'accountNumber', 'bankName', 'ifscCode', 'upiId'
        ];
        // Check if any sensitive field is being updated
        const updateData = {};
        const sensitiveChanges = {};
        const oldSensitiveData = {};
        let hasSensitiveChanges = false;
        // Map of fields to their values in req.body
        const fieldMapping = {
            name: data.name,
            category: data.category,
            location: data.location,
            fullAddress: data.fullAddress,
            openTime: data.openTime,
            description: data.description,
            history: data.history,
            phone: data.phone,
            website: data.website,
            mapUrl: data.mapUrl,
            viewers: data.viewers,
            isLive: data.isLive !== undefined ? (String(data.isLive) === 'true') : undefined,
            liveUrl: data.liveUrl,
            // Technical Identity
            slug: data.slug,
            subdomain: data.subdomain,
            urlType: data.urlType,
            // If user pastes a raw YouTube Channel ID in liveUrl, persist it into channelId as well
            channelId: data.channelId || (typeof data.liveUrl === 'string' && data.liveUrl.trim().startsWith('UC') ? data.liveUrl.trim() : undefined),
        };
        // Handle files
        const newImage = getFilePath(files, 'image');
        if (newImage) {
            sensitiveChanges['image'] = newImage;
            oldSensitiveData['image'] = temple.image;
            hasSensitiveChanges = true;
        }
        const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : null;
        if (newHeroImages && newHeroImages.length > 0) {
            sensitiveChanges['heroImages'] = newHeroImages;
            oldSensitiveData['heroImages'] = temple.heroImages;
            hasSensitiveChanges = true;
        }
        const newGallery = files && files['gallery'] ? getFilePaths(files, 'gallery') : null;
        if (newGallery && newGallery.length > 0) {
            sensitiveChanges['gallery'] = newGallery;
            oldSensitiveData['gallery'] = temple.gallery;
            hasSensitiveChanges = true;
        }
        // Check textual fields
        for (const key in fieldMapping) {
            const newValue = fieldMapping[key];
            const oldValue = temple[key];
            if (newValue !== undefined && newValue !== oldValue) {
                if (sensitiveFields.includes(key)) {
                    sensitiveChanges[key] = newValue;
                    oldSensitiveData[key] = oldValue;
                    hasSensitiveChanges = true;
                }
                else {
                    updateData[key] = newValue;
                }
            }
        }
        if (hasSensitiveChanges) {
            // Create a pending update request
            await prisma_1.prisma.templeUpdateRequest.create({
                data: {
                    templeId: temple.id,
                    requestedData: sensitiveChanges,
                    oldData: oldSensitiveData,
                    status: 'PENDING'
                }
            });
            // Update non-sensitive fields immediately if any
            if (Object.keys(updateData).length > 0) {
                await prisma_1.prisma.temple.update({
                    where: { id: temple.id },
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
        if (Object.keys(updateData).length > 0) {
            const updatedTemple = await prisma_1.prisma.temple.update({
                where: { id: temple.id },
                data: updateData
            });
            return res.json({ success: true, data: updatedTemple, message: 'Profile updated successfully' });
        }
        res.json({ success: true, message: 'No changes detected' });
    }
    catch (error) {
        console.error('Update Temple Profile Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateMyTempleProfile = updateMyTempleProfile;
const getTempleDevotees = async (req, res) => {
    try {
        const { userId } = req.user;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        // 1. Fetch users who have booked poojas
        const poojaBookings = await prisma_1.prisma.poojaBooking.findMany({
            where: { templeId: temple.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profileImage: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // 2. Fetch users who have ordered products (via SubOrders)
        const productSubOrders = await prisma_1.prisma.subOrder.findMany({
            where: { templeId: temple.id },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                profileImage: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Process Pooja Bookers
        const poojaDevoteesMap = new Map();
        poojaBookings.forEach(booking => {
            if (!booking.user)
                return;
            if (!poojaDevoteesMap.has(booking.userId)) {
                poojaDevoteesMap.set(booking.userId, {
                    ...booking.user,
                    lastInteraction: booking.createdAt,
                    totalInteractions: 0,
                    totalSpent: 0,
                    type: 'POOJA'
                });
            }
            const devotee = poojaDevoteesMap.get(booking.userId);
            devotee.totalInteractions += 1;
            devotee.totalSpent += booking.packagePrice;
            if (new Date(booking.createdAt) > new Date(devotee.lastInteraction)) {
                devotee.lastInteraction = booking.createdAt;
            }
        });
        // Process Product Customers
        const productDevoteesMap = new Map();
        productSubOrders.forEach(subOrder => {
            if (!subOrder.order.user)
                return;
            if (!productDevoteesMap.has(subOrder.order.userId)) {
                productDevoteesMap.set(subOrder.order.userId, {
                    ...subOrder.order.user,
                    lastInteraction: subOrder.createdAt,
                    totalInteractions: 0,
                    totalSpent: 0,
                    type: 'PRODUCT'
                });
            }
            const devotee = productDevoteesMap.get(subOrder.order.userId);
            devotee.totalInteractions += 1;
            devotee.totalSpent += subOrder.totalAmount;
            if (new Date(subOrder.createdAt) > new Date(devotee.lastInteraction)) {
                devotee.lastInteraction = subOrder.createdAt;
            }
        });
        const poojaBookers = Array.from(poojaDevoteesMap.values());
        const productCustomers = Array.from(productDevoteesMap.values());
        res.json({
            success: true,
            data: {
                poojaBookers,
                productCustomers,
                stats: {
                    totalDevotees: new Set([...poojaDevoteesMap.keys(), ...productDevoteesMap.keys()]).size,
                    poojaBookersCount: poojaBookers.length,
                    productCustomersCount: productCustomers.length,
                }
            }
        });
    }
    catch (error) {
        console.error('Get Temple Devotees Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTempleDevotees = getTempleDevotees;
