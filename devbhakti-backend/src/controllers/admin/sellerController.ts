import { Request, Response } from 'express';
import { prisma } from "../../lib/prisma";
import { createShiprocketPickupLocation } from '../../services/shiprocketService';
import { SlabType, CommissionCategory } from "@prisma/client";
import { parseLocation, extractPincode } from '../../lib/shiprocketUtils';

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

// Create Seller
export const createSeller = async (req: Request, res: Response) => {
    try {
        const { storeName, sellerName, email, phone, address, productCommissionRate } = req.body;

        if (!storeName || !sellerName || !email || !phone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const normalizedPhone = normalizePhone(phone as string);

        // Check if a SELLER already exists with this phone or email
        const existingSellerByPhone = await prisma.user.findFirst({
            where: { phone: normalizedPhone, role: 'SELLER' }
        });
        if (existingSellerByPhone) {
            return res.status(400).json({
                message: `A Seller is already registered with this phone number. Please use a different number.`
            });
        }

        const existingSellerByEmail = await prisma.user.findFirst({
            where: { email: email as string, role: 'SELLER' }
        });
        if (existingSellerByEmail) {
            return res.status(400).json({
                message: `A Seller is already registered with this email address. Please use a different email.`
            });
        }

        // Transaction to create User and associated SellerProfile (Store)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    name: sellerName as string,
                    email: email as string,
                    phone: normalizedPhone,
                    role: 'SELLER',
                    isVerified: false, // Set to false to require approval
                }
            });

            // 2. Create SellerProfile (Store entity)
            const sellerProfile = await tx.sellerProfile.create({
                data: {
                    name: storeName as string,
                    location: (address as string) || '', // Using address as location
                    fullAddress: (address as string) || '',
                    description: `Official Store of ${sellerName}`,
                    category: 'store', // Identifying as store
                    userId: user.id,
                    openTime: '9:00 AM - 9:00 PM', // Default
                    productCommissionRate: parseFloat(productCommissionRate as string) || 10.0,
                    pickupLocation: `PICKUP_${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                }
            });

            // 3. Handle Commission Slabs
            const commissionSlabs = req.body.commissionSlabs;
            if (commissionSlabs && Array.isArray(commissionSlabs)) {
                await tx.commissionSlab.createMany({
                    data: commissionSlabs.map((s: any) => ({
                        minAmount: parseFloat(s.minAmount),
                        maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                        platformFee: parseFloat(s.platformFee || 0),
                        percentage: parseFloat(s.percentage || 0),
                        slabType: SlabType.SELLER,
                        targetId: sellerProfile.id,
                        category: CommissionCategory.MARKETPLACE,
                        isActive: true
                    }))
                });
            }

            return { user, sellerProfile };
        });

        // 3. Register Pickup Location with Shiprocket
        try {
            const { city, state } = parseLocation(address as string || "");
            const pincode = extractPincode(address as string || "");

            const pickupData = {
                pickup_location: (result.sellerProfile as any).pickupLocation,
                name: sellerName as string,
                email: email as string,
                phone: normalizedPhone,
                address: (address as string) || '',
                city: city || "Delhi",
                state: state || "Delhi",
                country: "India",
                pin_code: pincode || "110001"
            };
            await createShiprocketPickupLocation(pickupData);
            console.log("Shiprocket Pickup Location Created Successfully");
        } catch (srError) {
            console.error("Failed to create Shiprocket Pickup Location:", srError);
        }

        res.status(201).json({
            message: 'Seller created successfully and synced with Shiprocket',
            data: result
        });

    } catch (error: any) {
        console.error('Create Seller Error:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

// Get All Sellers
export const getAllSellers = async (req: Request, res: Response) => {
    try {
        const sellers = await prisma.user.findMany({
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
        const formattedSellers = sellers.map((user: any) => {
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
                totalSales: store?.subOrders?.reduce((sum: number, order: any) => sum + order.totalAmount, 0) || 0
            };
        });

        res.json({
            status: 'success',
            data: formattedSellers
        });

    } catch (error: any) {
        console.error('Get Sellers Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Seller By ID
export const getSellerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: id as string },
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

        // Fetch slabs separately for the seller profile
        const slabs = user.sellerProfile ? await prisma.commissionSlab.findMany({
            where: { targetId: user.sellerProfile.id, slabType: SlabType.SELLER, isActive: true }
        }) : [];

        // Cast to any to avoid partial type issues for now
        const userAny = user as any;

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
            totalSales: userAny.sellerProfile?.subOrders?.reduce((sum: number, order: any) => sum + order.totalAmount, 0) || 0,
            commissionSlabs: slabs
        };

        res.json({
            status: 'success',
            data: formattedSeller
        });

    } catch (error: any) {
        console.error('Get Seller Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update Seller
export const updateSeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { storeName, sellerName, email, phone, status, address, productCommissionRate } = req.body;

        const normalizedPhone = phone ? normalizePhone(phone as string) : undefined;

        // Transaction to update User and SellerProfile
        await prisma.$transaction(async (tx) => {
            // Update User
            await tx.user.update({
                where: { id: id as string },
                data: {
                    name: sellerName as string,
                    email: email as string,
                    phone: normalizedPhone,
                    isVerified: status === 'active' || status === 'approved' ? true : false
                }
            });

            // Update SellerProfile (Store)
            const user = await tx.user.findUnique({ where: { id: id as string }, include: { sellerProfile: true } });

            if (user && user.sellerProfile) {
                const sellerProfileId = user.sellerProfile.id;
                await tx.sellerProfile.update({
                    where: { id: sellerProfileId },
                    data: {
                        name: storeName as string,
                        fullAddress: address as string,
                        location: address as string, // Sync location
                        productCommissionRate: parseFloat(productCommissionRate as string)
                    }
                });

                // Handle Commission Slabs Update
                const commissionSlabs = req.body.commissionSlabs;
                if (commissionSlabs && Array.isArray(commissionSlabs)) {
                    // Delete old slabs
                    await tx.commissionSlab.deleteMany({
                        where: { targetId: sellerProfileId, slabType: SlabType.SELLER }
                    });

                    // Create new slabs
                    if (commissionSlabs.length > 0) {
                        await tx.commissionSlab.createMany({
                            data: commissionSlabs.map((s: any) => ({
                                minAmount: parseFloat(s.minAmount),
                                maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                                platformFee: parseFloat(s.platformFee || 0),
                                percentage: parseFloat(s.percentage || 0),
                                slabType: SlabType.SELLER,
                                targetId: sellerProfileId,
                                category: CommissionCategory.MARKETPLACE,
                                isActive: true
                            }))
                        });
                    }
                }
            }
        });

        res.json({ message: 'Seller updated successfully' });

    } catch (error: any) {
        console.error('Update Seller Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete Seller
export const deleteSeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`[DeleteSeller] Attempting to delete seller with ID: ${id}`);

        // First, fetch seller with all related data for stats
        const user = await prisma.user.findUnique({
            where: { id: id as string },
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

        const sellerProfile = (user as any).sellerProfile;

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
        await prisma.$transaction(async (tx) => {
            const sellerId = sellerProfile.id;

            // 1. Delete product variants first (they depend on products)
            const productIds = sellerProfile.products.map((p: any) => p.id);
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
                where: { id: id as string }
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

    } catch (error: any) {
        console.error('Delete Seller Error:', error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

// Toggle Seller Status
export const toggleSellerStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active', 'inactive', 'pending'

        const isVerified = status === 'active';

        await prisma.user.update({
            where: { id: id as string },
            data: { isVerified }
        });

        res.json({ message: 'Status updated successfully' });

    } catch (error: any) {
        console.error('Toggle Status Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
