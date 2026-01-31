"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPoojas = exports.getPoojaById = exports.registerTemple = exports.getTempleById = exports.getAllTemples = void 0;
const prisma_1 = require("../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';
const getUserIdFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return null;
    const token = authHeader.split(' ')[1];
    if (!token)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded.userId;
    }
    catch (error) {
        return null;
    }
};
const getAllTemples = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        // Fetch only temples where user is verified
        const temples = await prisma_1.prisma.temple.findMany({
            where: {
                user: {
                    isVerified: true
                }
            },
            include: {
                poojas: {
                    where: { status: true }
                }
            }
        });
        let favoritedTempleIds = new Set();
        // If user is logged in, fetch their favorites
        if (userId) {
            const favorites = await prisma_1.prisma.favorite.findMany({
                where: {
                    userId: userId,
                    templeId: { not: null }
                },
                select: { templeId: true }
            });
            favorites.forEach(fav => {
                if (fav.templeId)
                    favoritedTempleIds.add(fav.templeId);
            });
        }
        // Map temples to include isFavorite
        const templesWithFav = temples.map(temple => ({
            ...temple,
            isFavorite: favoritedTempleIds.has(temple.id)
        }));
        res.json({ success: true, data: templesWithFav });
    }
    catch (error) {
        console.error('Fetch temples error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch temples' });
    }
};
exports.getAllTemples = getAllTemples;
const getTempleById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getUserIdFromRequest(req);
        const temple = await prisma_1.prisma.temple.findFirst({
            where: {
                id: id,
                user: {
                    isVerified: true
                }
            },
            include: {
                poojas: {
                    where: { status: true }
                },
                events: {
                    where: { status: true }
                },
                user: {
                    select: { isVerified: true }
                }
            }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found or not verified' });
        }
        let isFavorite = false;
        if (userId) {
            const fav = await prisma_1.prisma.favorite.findUnique({
                where: {
                    userId_templeId: {
                        userId: userId,
                        templeId: temple.id
                    }
                }
            });
            if (fav)
                isFavorite = true;
        }
        res.json({ success: true, data: { ...temple, isFavorite } });
    }
    catch (error) {
        console.error('Fetch temple details error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch temple details' });
    }
};
exports.getTempleById = getTempleById;
const registerTemple = async (req, res) => {
    try {
        const body = req.body;
        // This is a dummy endpoint. Real registration happens in temple_admin/templeController.ts
        res.status(201).json({ success: true, message: "Temple registered successfully", data: body });
    }
    catch (error) {
        res.status(400).json({ success: false, message: 'Invalid temple data' });
    }
};
exports.registerTemple = registerTemple;
const getPoojaById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getUserIdFromRequest(req);
        const pooja = await prisma_1.prisma.pooja.findFirst({
            where: {
                id: String(id),
                temple: {
                    user: {
                        isVerified: true
                    }
                }
            },
            include: {
                temple: true
            }
        });
        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }
        let isFavorite = false;
        if (userId) {
            const fav = await prisma_1.prisma.favorite.findUnique({
                where: {
                    userId_poojaId: {
                        userId: userId,
                        poojaId: pooja.id
                    }
                }
            });
            if (fav)
                isFavorite = true;
        }
        res.json({ success: true, data: { ...pooja, isFavorite } });
    }
    catch (error) {
        console.error('Get pooja error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pooja' });
    }
};
exports.getPoojaById = getPoojaById;
const getAllPoojas = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const poojas = await prisma_1.prisma.pooja.findMany({
            where: {
                status: true,
                temple: {
                    user: {
                        isVerified: true
                    }
                }
            },
            include: {
                temple: {
                    select: {
                        name: true,
                        location: true,
                        image: true
                    }
                }
            }
        });
        let favoritedPoojaIds = new Set();
        if (userId) {
            const favorites = await prisma_1.prisma.favorite.findMany({
                where: {
                    userId: userId,
                    poojaId: { not: null }
                },
                select: { poojaId: true }
            });
            favorites.forEach(fav => {
                if (fav.poojaId)
                    favoritedPoojaIds.add(fav.poojaId);
            });
        }
        const poojasWithFav = poojas.map(pooja => ({
            ...pooja,
            isFavorite: favoritedPoojaIds.has(pooja.id)
        }));
        res.json({ success: true, data: poojasWithFav });
    }
    catch (error) {
        console.error('Fetch poojas error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch poojas' });
    }
};
exports.getAllPoojas = getAllPoojas;
