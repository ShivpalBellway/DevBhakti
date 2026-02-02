"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectUpdateRequest = exports.approveUpdateRequest = exports.getPendingUpdateRequests = exports.deleteTemple = exports.toggleTempleStatus = exports.updateTemple = exports.createTemple = exports.getAllTemples = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
// Helper to get file paths
const getFilePath = (files, fieldName) => {
    if (!files || !files[fieldName])
        return null;
    if (fieldName === 'image')
        return `/uploads/temples/${files[fieldName][0].filename}`;
    return files[fieldName].map((f) => `/uploads/temples/${f.filename}`);
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
// Get all Temples (via User accounts)
const getAllTemples = async (req, res) => {
    try {
        const temples = await prisma.user.findMany({
            where: {
                role: 'INSTITUTION'
            },
            include: {
                temple: {
                    include: {
                        _count: {
                            select: { poojas: true, events: true },
                        },
                        poojas: {
                            select: { id: true, name: true, category: true, price: true, duration: true }
                        },
                        events: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(temples);
    }
    catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch temples' });
    }
};
exports.getAllTemples = getAllTemples;
// Create Temple Admin & Profile
const createTemple = async (req, res) => {
    try {
        const files = req.files;
        const data = req.body;
        // Parse JSON fields safely
        const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
        const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];
        if (data.phone) {
            data.phone = normalizePhone(data.phone);
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password || '123456', 10);
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User & Temple
            const user = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    password: hashedPassword,
                    role: 'INSTITUTION',
                    isVerified: false,
                    temple: {
                        create: {
                            templeId: `TMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                            name: data.templeName,
                            location: data.location,
                            fullAddress: data.fullAddress,
                            description: data.description,
                            history: data.history,
                            category: data.category,
                            openTime: data.openTime,
                            phone: data.templePhone,
                            website: data.website,
                            mapUrl: data.mapUrl,
                            viewers: data.viewers,
                            rating: parseFloat(data.rating || '0'),
                            reviewsCount: parseInt(data.reviewsCount || '0'),
                            slug: data.slug || undefined,
                            isActive: data.isActive === 'true',
                            liveStatus: data.liveStatus === 'true',
                            productCommissionRate: data.productCommissionRate ? parseFloat(data.productCommissionRate) : 10.0,
                            poojaCommissionRate: data.poojaCommissionRate ? parseFloat(data.poojaCommissionRate) : 5.0,
                            image: getFilePath(files, 'image'),
                            heroImages: getFilePath(files, 'heroImages') || [],
                        }
                    }
                },
                include: { temple: true }
            });
            const templeId = user.temple.id;
            // 2. Connect Poojas
            if (poojaIds.length > 0) {
                await tx.pooja.updateMany({
                    where: { id: { in: poojaIds } },
                    data: { templeId: templeId }
                });
            }
            // 3. Create Inline Events
            if (inlineEvents.length > 0) {
                await tx.event.createMany({
                    data: inlineEvents.map((ev) => ({
                        name: ev.name,
                        date: ev.date,
                        description: ev.description || '',
                        templeId: templeId
                    }))
                });
            }
            return user;
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ error: error.message || 'Failed to create temple' });
    }
};
exports.createTemple = createTemple;
// Update Temple Admin & Profile
const updateTemple = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;
        const data = req.body;
        const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
        const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];
        const existingHeroImages = data.existingHeroImages ? JSON.parse(data.existingHeroImages) : [];
        if (data.phone) {
            data.phone = normalizePhone(data.phone);
        }
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update User & Temple
            const user = await tx.user.update({
                where: { id: String(id) },
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    temple: {
                        update: {
                            name: data.templeName,
                            location: data.location,
                            fullAddress: data.fullAddress,
                            description: data.description,
                            history: data.history,
                            category: data.category,
                            openTime: data.openTime,
                            phone: data.templePhone,
                            website: data.website,
                            mapUrl: data.mapUrl,
                            viewers: data.viewers,
                            rating: parseFloat(data.rating || '0'),
                            reviewsCount: parseInt(data.reviewsCount || '0'),
                            liveStatus: data.liveStatus === 'true',
                            // Merge image updates
                            ...(files?.image && { image: getFilePath(files, 'image') }),
                            heroImages: [
                                ...existingHeroImages,
                                ...(getFilePath(files, 'heroImages') || [])
                            ]
                        }
                    }
                },
                include: { temple: true }
            });
            const templeId = user.temple.id;
            // 2. Sync Poojas
            if (poojaIds.length > 0) {
                await tx.pooja.updateMany({
                    where: { id: { in: poojaIds } },
                    data: { templeId: templeId }
                });
            }
            // 3. Sync Events
            if (data.inlineEvents) {
                await tx.event.deleteMany({ where: { templeId: templeId } });
                if (inlineEvents.length > 0) {
                    await tx.event.createMany({
                        data: inlineEvents.map((ev) => ({
                            name: ev.name,
                            date: ev.date,
                            description: ev.description || '',
                            templeId: templeId
                        }))
                    });
                }
            }
            return user;
        });
        res.json(result);
    }
    catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message || 'Failed to update temple' });
    }
};
exports.updateTemple = updateTemple;
// Toggle Temple Status
const toggleTempleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified, isActive, slug, productCommissionRate, poojaCommissionRate } = req.body;
        console.log('toggleTempleStatus called:', {
            id,
            isVerified,
            isActive, // Changed from liveStatus to isActive
            slug,
            productCommissionRate,
            poojaCommissionRate
        });
        const result = await prisma.user.update({
            where: { id: String(id) },
            data: {
                isVerified: isVerified,
                temple: {
                    update: {
                        isActive: isActive !== undefined ? isActive : undefined, // Use isActive for visibility
                        slug: slug || undefined,
                        productCommissionRate: productCommissionRate ? parseFloat(productCommissionRate) : undefined,
                        poojaCommissionRate: poojaCommissionRate ? parseFloat(poojaCommissionRate) : undefined,
                    }
                }
            },
            include: { temple: true }
        });
        console.log('Temple status updated:', result.temple);
        res.json({ success: true, message: 'Status updated successfully', data: result });
    }
    catch (error) {
        console.error('Toggle status error:', error);
        // Handle unique constraint error for slug
        if (error.code === 'P2002' && error.meta?.target.includes('slug')) {
            return res.status(400).json({ error: 'Slug is already taken. Please choose another one.' });
        }
        res.status(500).json({ error: error.message || 'Failed to update status' });
    }
};
exports.toggleTempleStatus = toggleTempleStatus;
// Delete Temple account
const deleteTemple = async (req, res) => {
    try {
        const { id } = req.params;
        // Use a transaction to delete both records safely
        await prisma.$transaction(async (tx) => {
            // First find the user to get the temple ID
            const user = await tx.user.findUnique({
                where: { id: String(id) },
                include: { temple: true }
            });
            if (!user) {
                throw new Error('Temple account not found');
            }
            // Delete the temple record first (if it exists)
            if (user.temple) {
                await tx.temple.delete({
                    where: { id: user.temple.id }
                });
            }
            // Then delete the user record
            await tx.user.delete({ where: { id: String(id) } });
        });
        res.json({ message: 'Temple account deleted successfully' });
    }
    catch (error) {
        console.error('Delete error:', error);
        // If it's a foreign key constraint error, provide more specific message
        if (error.code === 'P2002') {
            res.status(400).json({
                error: 'Cannot delete temple account. Please delete all associated poojas and events first.'
            });
        }
        else if (error.message === 'Temple account not found') {
            res.status(404).json({ error: 'Temple account not found' });
        }
    }
};
exports.deleteTemple = deleteTemple;
// Get Pending Update Requests
const getPendingUpdateRequests = async (req, res) => {
    try {
        console.log("Admin: Fetching pending temple update requests...");
        const requests = await prisma.templeUpdateRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                temple: {
                    select: {
                        name: true,
                        location: true,
                        id: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`Found ${requests.length} pending requests.`);
        res.json(requests);
    }
    catch (error) {
        console.error('Fetch update requests CRITICAL ERROR:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ error: 'Failed to fetch update requests', details: error.message });
    }
};
exports.getPendingUpdateRequests = getPendingUpdateRequests;
// Approve Update Request
const approveUpdateRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const request = await prisma.templeUpdateRequest.findUnique({
            where: { id },
            include: { temple: true }
        });
        if (!request || request.status !== 'PENDING') {
            return res.status(404).json({ error: 'Pending update request not found' });
        }
        const requestedData = request.requestedData;
        await prisma.$transaction(async (tx) => {
            // 1. Update Temple with requested data
            await tx.temple.update({
                where: { id: request.templeId },
                data: requestedData
            });
            // 2. Mark request as APPROVED
            await tx.templeUpdateRequest.update({
                where: { id },
                data: { status: 'APPROVED' }
            });
        });
        res.json({ success: true, message: 'Update request approved and applied' });
    }
    catch (error) {
        console.error('Approve update request error:', error);
        res.status(500).json({ error: error.message || 'Failed to approve update request' });
    }
};
exports.approveUpdateRequest = approveUpdateRequest;
// Reject Update Request
const rejectUpdateRequest = async (req, res) => {
    try {
        const id = req.params.id;
        await prisma.templeUpdateRequest.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
        res.json({ success: true, message: 'Update request rejected' });
    }
    catch (error) {
        console.error('Reject update request error:', error);
        res.status(500).json({ error: error.message || 'Failed to reject update request' });
    }
};
exports.rejectUpdateRequest = rejectUpdateRequest;
