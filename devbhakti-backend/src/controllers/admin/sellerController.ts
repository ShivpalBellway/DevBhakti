import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

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
        const { storeName, sellerName, email, phone, address } = req.body;

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

        // Transaction to create User and associated Temple (Store)
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Create User
            const user = await prisma.user.create({
                data: {
                    name: sellerName as string,
                    email: email as string,
                    phone: normalizedPhone,
                    role: 'SELLER',
                    isVerified: true, // Auto-verify for admin created
                }
            });

            // 2. Create Temple (Store entity)
            const temple = await prisma.temple.create({
                data: {
                    name: storeName as string,
                    location: (address as string) || '', // Using address as location
                    fullAddress: (address as string) || '',
                    description: `Official Store of ${sellerName}`,
                    category: 'store', // Identifying as store
                    userId: user.id,
                    openTime: '9:00 AM - 9:00 PM', // Default
                    productCommissionRate: 10.0, // Default marketplace commission
                }
            });

            return { user, temple };
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
                temple: {
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
            const store = user.temple;
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: user.isVerified ? 'active' : 'inactive',
                joinDate: user.createdAt,

                // Store details from Temple
                storeName: store?.name || 'N/A',
                address: store?.fullAddress || '',
                templeId: store?.id,

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
            where: { id },
            include: {
                temple: {
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
            storeName: userAny.temple?.name || 'N/A',
            address: userAny.temple?.fullAddress || '',
            templeId: userAny.temple?.id,
            products: userAny.temple?.products || []
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
        const { storeName, sellerName, email, phone, status, address } = req.body;

        const normalizedPhone = phone ? normalizePhone(phone as string) : undefined;

        // Transaction to update User and Temple
        await prisma.$transaction(async (prisma) => {
            // Update User
            await prisma.user.update({
                where: { id },
                data: {
                    name: sellerName as string,
                    email: email as string,
                    phone: normalizedPhone,
                    isVerified: status === 'active' || status === 'approved' ? true : false
                }
            });

            // Update Temple (Store)
            // First find the temple associated with this user
            const user = await prisma.user.findUnique({ where: { id }, include: { temple: true } });

            if (user && (user as any).temple) {
                await prisma.temple.update({
                    where: { id: (user as any).temple.id },
                    data: {
                        name: storeName as string,
                        fullAddress: address as string,
                        location: address as string // Sync location
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

        await prisma.$transaction(async (prisma) => {
            // Check if temple exists
            const user = await prisma.user.findUnique({
                where: { id },
                include: { temple: true }
            });

            if (user && (user as any).temple) {
                await prisma.temple.delete({
                    where: { id: (user as any).temple.id }
                });
            }

            await prisma.user.delete({
                where: { id }
            });
        });

        res.json({ message: 'Seller deleted successfully' });

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
            where: { id },
            data: { isVerified }
        });

        res.json({ message: 'Status updated successfully' });

    } catch (error: any) {
        console.error('Toggle Status Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
