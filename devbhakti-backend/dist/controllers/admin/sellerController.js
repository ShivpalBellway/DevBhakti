"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSellerStatus = exports.deleteSeller = exports.updateSeller = exports.getSellerById = exports.getAllSellers = exports.createSeller = void 0;
const prisma_1 = require("../../lib/prisma");
// Helper to normalize phone number to +91XXXXXXXXXX format
const normalizePhone = (phone) => {
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
// Create Seller
const createSeller = async (req, res) => {
    try {
        const { storeName, sellerName, email, phone, address, productCommissionRate } = req.body;
        if (!storeName || !sellerName || !email || !phone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const normalizedPhone = normalizePhone(phone);
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone: normalizedPhone }
                ]
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or phone already exists' });
        }
        // Transaction to create User and associated SellerProfile (Store)
        const result = await prisma_1.prisma.$transaction(async (prisma) => {
            // 1. Create User
            const user = await prisma.user.create({
                data: {
                    name: sellerName,
                    email: email,
                    phone: normalizedPhone,
                    role: 'SELLER',
                    isVerified: false, // Set to false to require approval
                }
            });
            // 2. Create SellerProfile (Store entity)
            const sellerProfile = await prisma.sellerProfile.create({
                data: {
                    name: storeName,
                    location: address || '', // Using address as location
                    fullAddress: address || '',
                    description: `Official Store of ${sellerName}`,
                    category: 'store', // Identifying as store
                    userId: user.id,
                    openTime: '9:00 AM - 9:00 PM', // Default
                    productCommissionRate: parseFloat(productCommissionRate) || 10.0,
                }
            });
            return { user, sellerProfile };
        });
        res.status(201).json({
            message: 'Seller created successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Create Seller Error:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};
exports.createSeller = createSeller;
// Get All Sellers
const getAllSellers = async (req, res) => {
    try {
        const sellers = await prisma_1.prisma.user.findMany({
            where: {
                role: 'SELLER'
            },
            include: {
                sellerProfile: {
                    include: {
                        products: {
                            select: { id: true }
                        },
                        subOrders: {
                            select: { id: true, totalAmount: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Transform data for frontend
        const formattedSellers = sellers.map((user) => {
            const store = user.sellerProfile;
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: user.isVerified ? 'active' : 'inactive',
                joinDate: user.createdAt,
                // Store details from SellerProfile
                storeName: store?.name || 'N/A',
                address: store?.fullAddress || '',
                productCommissionRate: store?.productCommissionRate || 0,
                sellerId: store?.id,
                // Stats
                totalProducts: store?.products?.length || 0,
                totalOrders: store?.subOrders?.length || 0,
                totalSales: store?.subOrders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0
            };
        });
        res.json({
            status: 'success',
            data: formattedSellers
        });
    }
    catch (error) {
        console.error('Get Sellers Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllSellers = getAllSellers;
// Get Seller By ID
const getSellerById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: id },
            include: {
                sellerProfile: {
                    include: {
                        products: {
                            include: {
                                variants: true,
                                categoryObj: true
                            }
                        },
                        subOrders: {
                            select: { id: true, totalAmount: true }
                        }
                    }
                }
            }
        });
        if (!user || user.role !== 'SELLER') {
            return res.status(404).json({ message: 'Seller not found' });
        }
        // Cast to any to avoid partial type issues for now
        const userAny = user;
        const formattedSeller = {
            id: userAny.id,
            name: userAny.name,
            email: userAny.email,
            phone: userAny.phone,
            status: userAny.isVerified ? 'active' : 'inactive',
            joinDate: userAny.createdAt,
            storeName: userAny.sellerProfile?.name || 'N/A',
            address: userAny.sellerProfile?.fullAddress || '',
            productCommissionRate: userAny.sellerProfile?.productCommissionRate || 0,
            sellerId: userAny.sellerProfile?.id,
            products: userAny.sellerProfile?.products || [],
            // Add missing fields
            logo: userAny.sellerProfile?.image || userAny.profileImage || '',
            totalProducts: userAny.sellerProfile?.products?.length || 0,
            totalOrders: userAny.sellerProfile?.subOrders?.length || 0,
            totalSales: userAny.sellerProfile?.subOrders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0
        };
        res.json({
            status: 'success',
            data: formattedSeller
        });
    }
    catch (error) {
        console.error('Get Seller Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getSellerById = getSellerById;
// Update Seller
const updateSeller = async (req, res) => {
    try {
        const { id } = req.params;
        const { storeName, sellerName, email, phone, status, address, productCommissionRate } = req.body;
        const normalizedPhone = phone ? normalizePhone(phone) : undefined;
        // Transaction to update User and SellerProfile
        await prisma_1.prisma.$transaction(async (prisma) => {
            // Update User
            await prisma.user.update({
                where: { id: id },
                data: {
                    name: sellerName,
                    email: email,
                    phone: normalizedPhone,
                    isVerified: status === 'active' || status === 'approved' ? true : false
                }
            });
            // Update SellerProfile (Store)
            // First find the sellerProfile associated with this user
            const user = await prisma.user.findUnique({ where: { id: id }, include: { sellerProfile: true } });
            if (user && user.sellerProfile) {
                await prisma.sellerProfile.update({
                    where: { id: user.sellerProfile.id },
                    data: {
                        name: storeName,
                        fullAddress: address,
                        location: address, // Sync location
                        productCommissionRate: parseFloat(productCommissionRate)
                    }
                });
            }
        });
        res.json({ message: 'Seller updated successfully' });
    }
    catch (error) {
        console.error('Update Seller Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateSeller = updateSeller;
// Delete Seller
const deleteSeller = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DeleteSeller] Attempting to delete seller with ID: ${id}`);
        // First, fetch seller with all related data for stats
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: id },
            include: {
                sellerProfile: {
                    include: {
                        products: true,
                        subOrders: true,
                        ledgerEntries: true,
                        withdrawals: true
                    }
                }
            }
        });
        if (!user || user.role !== 'SELLER') {
            return res.status(404).json({ message: 'Seller not found' });
        }
        const sellerProfile = user.sellerProfile;
        if (!sellerProfile) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }
        // Collect stats
        const stats = {
            products: sellerProfile?.products?.length || 0,
            orders: sellerProfile?.subOrders?.length || 0,
            ledgerEntries: sellerProfile?.ledgerEntries?.length || 0,
            withdrawals: sellerProfile?.withdrawals?.length || 0
        };
        // Delete all related data in a transaction (in correct order to avoid FK constraints)
        await prisma_1.prisma.$transaction(async (tx) => {
            const sellerId = sellerProfile.id;
            // 1. Delete product variants first (they depend on products)
            const productIds = sellerProfile.products.map((p) => p.id);
            if (productIds.length > 0) {
                await tx.productVariant.deleteMany({
                    where: { productId: { in: productIds } }
                });
                // Delete cart items
                await tx.cartItem.deleteMany({
                    where: { productId: { in: productIds } }
                });
                // Delete order items
                await tx.orderItem.deleteMany({
                    where: { productId: { in: productIds } }
                });
                // Delete favorites
                await tx.favorite.deleteMany({
                    where: { productId: { in: productIds } }
                });
            }
            // 2. Delete products
            await tx.product.deleteMany({
                where: { sellerId }
            });
            // 3. Delete sub-orders
            await tx.subOrder.deleteMany({
                where: { sellerId }
            });
            // 4. Delete ledger entries
            await tx.templeLedger.deleteMany({
                where: { sellerId }
            });
            // 5. Delete withdrawal requests
            await tx.withdrawalRequest.deleteMany({
                where: { sellerId }
            });
            // 6. Delete seller profile
            await tx.sellerProfile.delete({
                where: { id: sellerId }
            });
            // 7. Finally, delete user
            await tx.user.delete({
                where: { id: id }
            });
        });
        res.json({
            message: 'Seller and all related data deleted successfully',
            deletedData: {
                seller: user.name,
                productsDeleted: stats.products,
                ordersDeleted: stats.orders,
                ledgerEntriesDeleted: stats.ledgerEntries,
                withdrawalsDeleted: stats.withdrawals
            }
        });
    }
    catch (error) {
        console.error('Delete Seller Error:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};
exports.deleteSeller = deleteSeller;
// Toggle Seller Status
const toggleSellerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active', 'inactive', 'pending'
        const isVerified = status === 'active';
        await prisma_1.prisma.user.update({
            where: { id: id },
            data: { isVerified }
        });
        res.json({ message: 'Status updated successfully' });
    }
    catch (error) {
        console.error('Toggle Status Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.toggleSellerStatus = toggleSellerStatus;
