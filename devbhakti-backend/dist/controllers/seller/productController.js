"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getMyProductById = exports.getMyProducts = void 0;
const prisma_1 = require("../../lib/prisma");
// Get My Products
const getMyProducts = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Get Seller Store
        const store = await prisma_1.prisma.sellerProfile.findUnique({ where: { userId } });
        if (!store)
            return res.status(404).json({ success: false, message: "Store not found" });
        const { page = 1, limit = 10, search, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { sellerId: store.id };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ];
        }
        if (status) {
            where.status = status;
        }
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                include: {
                    variants: true,
                    categoryObj: { select: { name: true } }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit)
            }),
            prisma_1.prisma.product.count({ where })
        ]);
        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error("Seller Get Products Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getMyProducts = getMyProducts;
// Get My Product by ID
const getMyProductById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const store = await prisma_1.prisma.sellerProfile.findUnique({ where: { userId } });
        if (!store)
            return res.status(404).json({ success: false, message: "Store not found" });
        const product = await prisma_1.prisma.product.findFirst({
            where: { id: id, sellerId: store.id },
            include: {
                variants: true,
                categoryObj: { select: { id: true, name: true } },
                seller: { select: { id: true, name: true } }
            }
        });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, data: product });
    }
    catch (error) {
        console.error("Seller Get Product By ID Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getMyProductById = getMyProductById;
// Create Product
const createProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const store = await prisma_1.prisma.sellerProfile.findUnique({ where: { userId } });
        if (!store)
            return res.status(404).json({ success: false, message: "Store not found" });
        let name, description, category, categoryId, variants, image;
        let highlights, longDescription, shippingInfo, origin;
        if (req.is('multipart/form-data')) {
            name = req.body.name;
            description = req.body.description;
            category = req.body.category;
            categoryId = req.body.category || null;
            highlights = req.body.highlights;
            longDescription = req.body.longDescription;
            shippingInfo = req.body.shippingInfo;
            origin = req.body.origin;
            variants = req.body.variants ? JSON.parse(req.body.variants) : [];
            const files = req.files;
            if (files) {
                const productFile = files.find(f => f.fieldname === 'image');
                if (productFile)
                    image = `/uploads/products/${productFile.filename}`;
                variants = variants.map((v, index) => {
                    const variantFile = files.find(f => f.fieldname === `variant_image_${index}`);
                    if (variantFile)
                        v.image = `/uploads/products/${variantFile.filename}`;
                    return v;
                });
            }
        }
        else {
            const body = req.body;
            name = body.name;
            description = body.description;
            category = body.category;
            categoryId = body.category || null;
            highlights = body.highlights;
            longDescription = body.longDescription;
            shippingInfo = body.shippingInfo;
            origin = body.origin;
            variants = body.variants || [];
        }
        if (!name || !description || !category) {
            return res.status(400).json({ success: false, message: "Name, Description and Category are required" });
        }
        const product = await prisma_1.prisma.product.create({
            data: {
                name,
                description,
                category,
                categoryId,
                sellerId: store.id,
                status: "pending",
                highlights,
                longDescription,
                shippingInfo,
                origin,
                image,
                variants: {
                    create: variants.map((v) => ({
                        name: v.name,
                        price: parseFloat(v.price),
                        stock: parseInt(v.stock) || 0,
                        image: v.image || null
                    }))
                }
            },
            include: { variants: true }
        });
        res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        console.error("Seller Create Product Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.createProduct = createProduct;
// Update Product
const updateProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const store = await prisma_1.prisma.sellerProfile.findUnique({ where: { userId } });
        if (!store)
            return res.status(404).json({ success: false, message: "Store not found" });
        const existingProduct = await prisma_1.prisma.product.findFirst({
            where: { id: id, sellerId: store.id }
        });
        if (!existingProduct)
            return res.status(404).json({ success: false, message: "Product not found or access denied" });
        let name, description, category, categoryId, variants, image, removeImage;
        let highlights, longDescription, shippingInfo, origin;
        if (req.is('multipart/form-data')) {
            name = req.body.name;
            description = req.body.description;
            category = req.body.category;
            categoryId = req.body.category || null;
            highlights = req.body.highlights;
            longDescription = req.body.longDescription;
            shippingInfo = req.body.shippingInfo;
            origin = req.body.origin;
            variants = req.body.variants ? JSON.parse(req.body.variants) : [];
            const files = req.files;
            if (files) {
                const productFile = files.find(f => f.fieldname === 'image');
                if (productFile)
                    image = `/uploads/products/${productFile.filename}`;
                variants = variants.map((v, index) => {
                    const variantFile = files.find(f => f.fieldname === `variant_image_${index}`);
                    if (variantFile)
                        v.image = `/uploads/products/${variantFile.filename}`;
                    return v;
                });
            }
            removeImage = req.body.removeImage === 'true';
        }
        else {
            const body = req.body;
            name = body.name;
            description = body.description;
            category = body.category;
            categoryId = body.category || null;
            highlights = body.highlights;
            longDescription = body.longDescription;
            shippingInfo = body.shippingInfo;
            origin = body.origin;
            variants = body.variants || [];
        }
        const updateData = {};
        if (name)
            updateData.name = name;
        if (description)
            updateData.description = description;
        if (category)
            updateData.category = category;
        if (categoryId)
            updateData.categoryId = categoryId;
        if (highlights)
            updateData.highlights = highlights;
        if (longDescription)
            updateData.longDescription = longDescription;
        if (shippingInfo)
            updateData.shippingInfo = shippingInfo;
        if (origin)
            updateData.origin = origin;
        if (image)
            updateData.image = image;
        else if (removeImage)
            updateData.image = null;
        if (variants && variants.length > 0) {
            await prisma_1.prisma.productVariant.deleteMany({ where: { productId: id } });
            updateData.variants = {
                create: variants.map((v) => ({
                    name: v.name,
                    price: parseFloat(v.price),
                    stock: parseInt(v.stock) || 0,
                    image: v.image || null
                }))
            };
        }
        const updatedProduct = await prisma_1.prisma.product.update({
            where: { id: id },
            data: updateData,
            include: { variants: true }
        });
        res.status(200).json({ success: true, data: updatedProduct });
    }
    catch (error) {
        console.error("Seller Update Product Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.updateProduct = updateProduct;
// Delete Product
const deleteProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const store = await prisma_1.prisma.sellerProfile.findUnique({ where: { userId } });
        if (!store)
            return res.status(404).json({ success: false, message: "Store not found" });
        const existingProduct = await prisma_1.prisma.product.findFirst({
            where: { id: id, sellerId: store.id }
        });
        if (!existingProduct)
            return res.status(404).json({ success: false, message: "Product not found or access denied" });
        await prisma_1.prisma.product.delete({ where: { id: id } });
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    }
    catch (error) {
        console.error("Seller Delete Product Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.deleteProduct = deleteProduct;
