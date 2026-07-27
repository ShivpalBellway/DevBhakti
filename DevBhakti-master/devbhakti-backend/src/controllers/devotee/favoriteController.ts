import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { getLang, localize } from '../../utils/localization';

// 1. Add Favorite
export const addFavorite = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(403).json({
                success: false,
                message: 'Please login to favorite this'
            });
        }

        const { userId } = user;
        const { templeId, poojaId, productId, mandalId } = req.body;

        if (!templeId && !poojaId && !productId && !mandalId) {
            return res.status(400).json({
                success: false,
                message: 'Temple ID, Pooja ID, Product ID, or Mandal ID is required'
            });
        }

        const favorite = await prisma.favorite.create({
            data: {
                userId,
                templeId: templeId || null,
                poojaId: poojaId || null,
                productId: productId || null,
                mandalId: mandalId || null
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
        const user = (req as any).user;

        if (!user) {
            return res.status(403).json({
                success: false,
                message: 'Please login to remove this'
            });
        }

        const { userId } = user;
        const { templeId, poojaId, productId, mandalId } = req.body;

        if (!templeId && !poojaId && !productId && !mandalId) {
            return res.status(400).json({
                success: false,
                message: 'Temple ID, Pooja ID, Product ID, or Mandal ID is required'
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
        } else if (mandalId) {
            await prisma.favorite.delete({
                where: { userId_mandalId: { userId, mandalId } }
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
        const user = (req as any).user;

        if (!user) {
            return res.status(403).json({
                success: false,
                message: 'Please login to view favorites'
            });
        }

        const { userId } = user;

        const favorites = await prisma.favorite.findMany({
            where: { userId },
            include: {
                temple: true,
                mandal: true,
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
                },
                product: {
                    include: {
                        variants: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const lang = getLang(req);
        res.json({
            success: true,
            message: 'Favorites fetched successfully',
            data: localize(favorites, lang)
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
