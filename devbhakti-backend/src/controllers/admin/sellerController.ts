import { Request, Response } from 'express';
<<<<<<< HEAD
import { prisma } from "../../lib/prisma";
=======
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3

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

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email as string },
                    { phone: normalizedPhone }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or phone already exists' });
        }

<<<<<<< HEAD
        // Transaction to create User and associated SellerProfile (Store)
=======
        // Transaction to create User and associated Temple (Store)
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Create User
            const user = await prisma.user.create({
                data: {
                    name: sellerName as string,
                    email: email as string,
                    phone: normalizedPhone,
                    role: 'SELLER',
                    isVerified: false, // Set to false to require approval
                }
            });

<<<<<<< HEAD
            // 2. Create SellerProfile (Store entity)
            const sellerProfile = await prisma.sellerProfile.create({
=======
            // 2. Create Temple (Store entity)
            const temple = await prisma.temple.create({
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                data: {
                    name: storeName as string,
                    location: (address as string) || '', // Using address as location
                    fullAddress: (address as string) || '',
                    description: `Official Store of ${sellerName}`,
                    category: 'store', // Identifying as store
                    userId: user.id,
                    openTime: '9:00 AM - 9:00 PM', // Default
                    productCommissionRate: parseFloat(productCommissionRate as string) || 10.0,
                }
            });

<<<<<<< HEAD
            return { user, sellerProfile };
=======
            return { user, temple };
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
        });

        res.status(201).json({
            message: 'Seller created successfully',
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
<<<<<<< HEAD
                sellerProfile: {
=======
                temple: {
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
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
<<<<<<< HEAD
            const store = user.sellerProfile;
=======
            const store = user.temple;
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: user.isVerified ? 'active' : 'inactive',
                joinDate: user.createdAt,

<<<<<<< HEAD
                // Store details from SellerProfile
                storeName: store?.name || 'N/A',
                address: store?.fullAddress || '',
                productCommissionRate: store?.productCommissionRate || 0,
                sellerId: store?.id,
=======
                // Store details from Temple
                storeName: store?.name || 'N/A',
                address: store?.fullAddress || '',
                productCommissionRate: store?.productCommissionRate || 0,
                templeId: store?.id,
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3

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
<<<<<<< HEAD
                sellerProfile: {
=======
                temple: {
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                    include: {
                        products: true
                    }
                }
            }
        });

        if (!user || user.role !== 'SELLER') {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Cast to any to avoid partial type issues for now
        const userAny = user as any;

        const formattedSeller = {
            id: userAny.id,
            name: userAny.name,
            email: userAny.email,
            phone: userAny.phone,
            status: userAny.isVerified ? 'active' : 'inactive',
            joinDate: userAny.createdAt,
<<<<<<< HEAD
            storeName: userAny.sellerProfile?.name || 'N/A',
            address: userAny.sellerProfile?.fullAddress || '',
            productCommissionRate: userAny.sellerProfile?.productCommissionRate || 0,
            sellerId: userAny.sellerProfile?.id,
            products: userAny.sellerProfile?.products || []
=======
            storeName: userAny.temple?.name || 'N/A',
            address: userAny.temple?.fullAddress || '',
            productCommissionRate: userAny.temple?.productCommissionRate || 0,
            templeId: userAny.temple?.id,
            products: userAny.temple?.products || []
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
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

<<<<<<< HEAD
        // Transaction to update User and SellerProfile
=======
        // Transaction to update User and Temple
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
        await prisma.$transaction(async (prisma) => {
            // Update User
            await prisma.user.update({
                where: { id: id as string },
                data: {
                    name: sellerName as string,
                    email: email as string,
                    phone: normalizedPhone,
                    isVerified: status === 'active' || status === 'approved' ? true : false
                }
            });

<<<<<<< HEAD
            // Update SellerProfile (Store)
            // First find the sellerProfile associated with this user
            const user = await prisma.user.findUnique({ where: { id: id as string }, include: { sellerProfile: true } });

            if (user && (user as any).sellerProfile) {
                await prisma.sellerProfile.update({
                    where: { id: (user as any).sellerProfile.id },
=======
            // Update Temple (Store)
            // First find the temple associated with this user
            const user = await prisma.user.findUnique({ where: { id: id as string }, include: { temple: true } });

            if (user && (user as any).temple) {
                await prisma.temple.update({
                    where: { id: (user as any).temple.id },
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                    data: {
                        name: storeName as string,
                        fullAddress: address as string,
                        location: address as string, // Sync location
                        productCommissionRate: parseFloat(productCommissionRate as string)
                    }
                });
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
<<<<<<< HEAD
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
=======

        await prisma.$transaction(async (prisma) => {
            // Check if temple exists
            const user = await prisma.user.findUnique({
                where: { id: id as string },
                include: { temple: true }
            });

            if (user && (user as any).temple) {
                await prisma.temple.delete({
                    where: { id: (user as any).temple.id }
                });
            }

            await prisma.user.delete({
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                where: { id: id as string }
            });
        });

<<<<<<< HEAD
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
=======
        res.json({ message: 'Seller deleted successfully' });
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3

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
