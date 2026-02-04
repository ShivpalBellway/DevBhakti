"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoteToMaster = exports.deletePooja = exports.updatePooja = exports.createPooja = exports.getAllPoojas = void 0;
const prisma_1 = require("../../lib/prisma");
const getAllPoojas = async (req, res) => {
    try {
        const { isMaster, templeId } = req.query;
        const where = {};
        if (isMaster !== undefined) {
            where.isMaster = isMaster === 'true';
        }
        if (templeId) {
            where.templeId = String(templeId);
        }
        const poojas = await prisma_1.prisma.pooja.findMany({
            where,
            include: {
                temple: {
                    select: {
                        name: true
                    }
                },
                masterPooja: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(poojas);
    }
    catch (error) {
        console.error('Fetch poojas error:', error);
        res.status(500).json({ error: 'Failed to fetch poojas' });
    }
};
exports.getAllPoojas = getAllPoojas;
const createPooja = async (req, res) => {
    try {
        console.log('=== CREATE POOJA DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        const { name, category, price, duration, description, time, about, benefits, bullets, process, processSteps, templeId, packages, faqs, isMaster, masterPoojaId } = req.body;
        // Validate temple exists if provided
        if (templeId && templeId !== 'null' && templeId !== 'undefined') {
            const temple = await prisma_1.prisma.temple.findUnique({
                where: { id: String(templeId) }
            });
            if (!temple) {
                return res.status(400).json({ error: 'Invalid templeId: Temple does not exist' });
            }
        }
        // Handle image path
        let imagePath = '';
        if (req.file) {
            imagePath = `/uploads/poojas/${req.file.filename}`;
        }
        const pooja = await prisma_1.prisma.pooja.create({
            data: {
                name,
                category,
                price: parseFloat(price),
                duration,
                description: typeof description === 'string' ? JSON.parse(description) : description,
                time,
                image: imagePath,
                about,
                benefits: typeof benefits === 'string' ? JSON.parse(benefits) : benefits,
                bullets: typeof bullets === 'string' ? JSON.parse(bullets) : bullets,
                process,
                processSteps: typeof processSteps === 'string' ? JSON.parse(processSteps) : processSteps,
                templeId: (templeId && templeId !== 'null') ? String(templeId) : null,
                isMaster: isMaster === 'true' || isMaster === true,
                masterPoojaId: masterPoojaId || null,
                packages: typeof packages === 'string' ? JSON.parse(packages) : packages,
                faqs: typeof faqs === 'string' ? JSON.parse(faqs) : faqs
            }
        });
        res.status(201).json(pooja);
    }
    catch (error) {
        console.error('Create pooja error:', error);
        res.status(500).json({ error: 'Failed to create pooja' });
    }
};
exports.createPooja = createPooja;
const updatePooja = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, duration, description, time, about, benefits, bullets, process, processSteps, templeId, packages, faqs } = req.body;
        // Validate temple exists if templeId is provided
        if (templeId) {
            const temple = await prisma_1.prisma.temple.findUnique({
                where: { id: String(templeId) }
            });
            if (!temple) {
                return res.status(400).json({ error: 'Invalid templeId: Temple does not exist' });
            }
        }
        // Handle image path
        let updateData = {
            name,
            category,
            price: price ? parseFloat(price) : undefined,
            duration,
            description: typeof description === 'string' ? JSON.parse(description) : description,
            time,
            about,
            benefits: typeof benefits === 'string' ? JSON.parse(benefits) : benefits,
            bullets: typeof bullets === 'string' ? JSON.parse(bullets) : bullets,
            process,
            processSteps: typeof processSteps === 'string' ? JSON.parse(processSteps) : processSteps,
            templeId: (templeId && templeId !== 'null') ? String(templeId) : undefined,
            packages: typeof packages === 'string' ? JSON.parse(packages) : packages,
            faqs: typeof faqs === 'string' ? JSON.parse(faqs) : faqs
        };
        if (req.body.isMaster !== undefined) {
            updateData.isMaster = req.body.isMaster === 'true' || req.body.isMaster === true;
        }
        if (req.file) {
            updateData.image = `/uploads/poojas/${req.file.filename}`;
        }
        const pooja = await prisma_1.prisma.pooja.update({
            where: { id: String(id) },
            data: updateData
        });
        res.json(pooja);
    }
    catch (error) {
        console.error('Update pooja error:', error);
        res.status(500).json({ error: 'Failed to update pooja' });
    }
};
exports.updatePooja = updatePooja;
const deletePooja = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.pooja.delete({
            where: { id: String(id) }
        });
        res.json({ message: 'Pooja deleted successfully' });
    }
    catch (error) {
        console.error('Delete pooja error:', error);
        res.status(500).json({ error: 'Failed to delete pooja' });
    }
};
exports.deletePooja = deletePooja;
/**
 * Promote a Temple Pooja to a Master Pooja template
 */
const promoteToMaster = async (req, res) => {
    try {
        const { id } = req.params;
        const templePooja = await prisma_1.prisma.pooja.findUnique({
            where: { id: String(id) }
        });
        if (!templePooja) {
            return res.status(404).json({ error: 'Pooja not found' });
        }
        // Create a new Master Pooja using temple pooja data
        const masterPooja = await prisma_1.prisma.pooja.create({
            data: {
                name: templePooja.name,
                category: templePooja.category,
                price: templePooja.price,
                duration: templePooja.duration,
                description: templePooja.description,
                time: templePooja.time,
                image: templePooja.image,
                about: templePooja.about,
                benefits: templePooja.benefits,
                bullets: templePooja.bullets,
                process: templePooja.process,
                processSteps: templePooja.processSteps || undefined,
                templeId: null, // Master poojas don't belong to a temple
                isMaster: true,
                packages: templePooja.packages || undefined,
                faqs: templePooja.faqs || undefined
            }
        });
        // Update the original temple pooja to link it to this master
        await prisma_1.prisma.pooja.update({
            where: { id: String(id) },
            data: {
                masterPoojaId: masterPooja.id
            }
        });
        res.json({
            message: 'Pooja promoted to Master template successfully',
            masterPooja
        });
    }
    catch (error) {
        console.error('Promote pooja error:', error);
        res.status(500).json({ error: 'Failed to promote pooja' });
    }
};
exports.promoteToMaster = promoteToMaster;
