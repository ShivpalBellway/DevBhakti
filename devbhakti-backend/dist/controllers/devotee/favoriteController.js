"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavorites = exports.removeFavorite = exports.addFavorite = void 0;
const prisma_1 = require("../../lib/prisma");
// 1. Add Favorite
const addFavorite = async (req, res) => {
    try {
        const { userId } = req.user;
        const { templeId, poojaId, productId } = req.body;
        if (!templeId && !poojaId && !productId) {
            return res.status(400).json({
                success: false,
                message: 'Temple ID, Pooja ID, or Product ID is required'
            });
        }
        const favorite = await prisma_1.prisma.favorite.create({
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
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Item already in favorites'
            });
        }
        console.error('Add favorite error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.addFavorite = addFavorite;
// 2. Remove Favorite
const removeFavorite = async (req, res) => {
    try {
        const { userId } = req.user;
        const { templeId, poojaId, productId } = req.body;
        if (!templeId && !poojaId && !productId) {
            return res.status(400).json({
                success: false,
                message: 'Temple ID, Pooja ID, or Product ID is required'
            });
        }
        if (templeId) {
            await prisma_1.prisma.favorite.delete({
                where: { userId_templeId: { userId, templeId } }
            });
        }
        else if (poojaId) {
            await prisma_1.prisma.favorite.delete({
                where: { userId_poojaId: { userId, poojaId } }
            });
        }
        else if (productId) {
            await prisma_1.prisma.favorite.delete({
                where: { userId_productId: { userId, productId } }
            });
        }
        res.json({ success: true, message: 'Item removed from favorites' });
    }
    catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.removeFavorite = removeFavorite;
// 3. List Favorites
const getFavorites = async (req, res) => {
    try {
        const { userId } = req.user;
        const favorites = await prisma_1.prisma.favorite.findMany({
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
    }
    catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getFavorites = getFavorites;
