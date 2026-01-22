"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPoojas = exports.getPoojaById = exports.registerTemple = exports.getTempleById = exports.getAllTemples = void 0;
const prisma_1 = require("../lib/prisma");
const getAllTemples = async (req, res) => {
    try {
        const temples = await prisma_1.prisma.temple.findMany({
            include: {
                poojas: true
            }
        });
        res.json({ success: true, data: temples });
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
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { id: id },
            include: {
                poojas: true,
                events: true
            }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        res.json({ success: true, data: temple });
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
        // Logic to save to DB will go here after schema is defined
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
        const pooja = await prisma_1.prisma.pooja.findUnique({
            where: { id: String(id) },
            include: {
                temple: true
            }
        });
        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }
        res.json({ success: true, data: pooja });
    }
    catch (error) {
        console.error('Get pooja error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pooja' });
    }
};
exports.getPoojaById = getPoojaById;
const getAllPoojas = async (req, res) => {
    try {
        const poojas = await prisma_1.prisma.pooja.findMany({
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
        res.json({ success: true, data: poojas });
    }
    catch (error) {
        console.error('Fetch poojas error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch poojas' });
    }
};
exports.getAllPoojas = getAllPoojas;
