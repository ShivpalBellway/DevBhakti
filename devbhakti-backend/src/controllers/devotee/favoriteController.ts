import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

// 1. Add Favorite
export const addFavorite = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const { templeId, poojaId, productId } = req.body;

        if (!templeId && !poojaId && !productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Temple ID, Pooja ID, or Product ID is required' 
            });
        }

        const favorite = await prisma.favorite.create({
            data: {
                userId,
                templeId: templeId || null,
                poojaId: poojaId || null,
                productId: productId || null
            }
        });

        res.status(201).json({ 
            success: true, 
            message: 'Item added to favorites', 
            data: favorite 
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ 
                success: false, 
                message: 'Item already in favorites' 
            });
        }
        console.error('Add favorite error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// 2. Remove Favorite
export const removeFavorite = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const { templeId, poojaId, productId } = req.body;

        if (!templeId && !poojaId && !productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Temple ID, Pooja ID, or Product ID is required' 
            });
        }

        if (templeId) {
            await prisma.favorite.delete({
                where: { userId_templeId: { userId, templeId } }
            });
        } else if (poojaId) {
            await prisma.favorite.delete({
                where: { userId_poojaId: { userId, poojaId } }
            });
        } else if (productId) {
            await prisma.favorite.delete({
                where: { userId_productId: { userId, productId } }
            });
        }

        res.json({ success: true, message: 'Item removed from favorites' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Item not found in favorites'
            });
        }
        console.error('Remove favorite error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// 3. List Favorites
export const getFavorites = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;

        const favorites = await prisma.favorite.findMany({
            where: { userId },
            include: {
                temple: true,
                pooja: {
                    include: {
                        temple: {
                            select: {
                                name: true,
                                location: true,
                                image: true
                            }
                        }
                    }
                }
                // product: true // Future: Add product relation when marketplace is ready
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ 
            success: true, 
            message: 'Favorites fetched successfully', 
            data: favorites 
        });
    } catch (error: any) {
        console.error('Get favorites error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message
        });
    }
};
