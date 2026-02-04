"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductOwners = exports.getPublicProducts = exports.getProductsByTemple = exports.toggleProductStatus = exports.deleteProduct = exports.updateProduct = exports.getPublicProductById = exports.getProductById = exports.getAllProducts = exports.createProduct = void 0;
const prisma_1 = require("../../lib/prisma");
// Create Product
const createProduct = async (req, res) => {
    try {
        // Handle both JSON and FormData
        let name, description, category, categoryId, templeId, status, variants, image;
        let highlights, longDescription, shippingInfo, origin, rating;
        if (req.is('multipart/form-data')) {
            // FormData handling
            name = req.body.name;
            description = req.body.description;
            category = req.body.category;
            categoryId = req.body.category || null; // Use category field as categoryId
            templeId = req.body.templeId || null;
            status = req.body.status || "pending";
            highlights = req.body.highlights;
            longDescription = req.body.longDescription;
            shippingInfo = req.body.shippingInfo;
            origin = req.body.origin;
            rating = req.body.rating ? parseFloat(req.body.rating) : undefined;
            // Parse variants from JSON string
            variants = req.body.variants ? JSON.parse(req.body.variants) : [];
            // Handle file upload
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
            // JSON handling
            const { name: productName, description: productDescription, category: productCategory, categoryId: productCategoryId, templeId: productTempleId, status: productStatus = "pending", variants: productVariants, highlights: productHighlights, longDescription: productLongDescription, shippingInfo: productShippingInfo, origin: productOrigin, rating: productRating } = req.body;
            name = productName;
            description = productDescription;
            category = productCategory;
            categoryId = productCategory || null; // Use category field as categoryId
            templeId = productTempleId || null;
            status = productStatus;
            variants = productVariants || [];
            highlights = productHighlights;
            longDescription = productLongDescription;
            shippingInfo = productShippingInfo;
            origin = productOrigin;
            rating = productRating;
        }
        // Validate required fields
        if (!name || !description || !category) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, description, category are required"
            });
        }
        const createData = {
            name,
            description,
            status,
            highlights,
            longDescription,
            shippingInfo,
            origin,
            rating,
            image: image || null,
            variants: {
                create: variants.map((variant) => ({
                    name: variant.name,
                    price: parseFloat(variant.price),
                    stock: parseInt(variant.stock) || 0,
                    image: variant.image || null
                }))
            }
        };
        // Handle Category
        if (categoryId) {
            const categoryRecord = await prisma_1.prisma.productCategory.findUnique({ where: { id: categoryId } });
            if (categoryRecord) {
                createData.categoryId = categoryId;
                createData.category = categoryRecord.name;
            }
            else {
                createData.category = category;
            }
        }
        else {
            createData.category = category;
        }
        // Handle Vendor (Temple or Seller)
        if (templeId && templeId !== "general") {
            // Check Temple
            const temple = await prisma_1.prisma.temple.findUnique({ where: { id: templeId } });
            if (temple) {
                createData.templeId = temple.id;
            }
            else {
                // Check Seller
                const seller = await prisma_1.prisma.sellerProfile.findUnique({ where: { id: templeId } });
                if (seller) {
                    createData.sellerId = seller.id;
                }
                else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid vendor reference",
                        details: "The specified owner (Temple or Seller) does not exist"
                    });
                }
            }
        }
        // Create product
        const product = await prisma_1.prisma.product.create({
            data: createData,
            include: {
                variants: true,
                categoryObj: true,
                temple: true,
                seller: true
            }
        });
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    }
    catch (error) {
        console.error("Create Product Error:", error);
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: "Product already exists",
                details: "A product with this name already exists."
            });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error while creating product",
        });
    }
};
exports.createProduct = createProduct;
// Get All Products (Admin)
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category, status, templeId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Build where clause
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ];
        }
        if (category) {
            where.category = category;
        }
        if (status) {
            where.status = status;
        }
        if (templeId) {
            where.templeId = templeId;
        }
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                include: {
                    variants: true,
                    categoryObj: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    temple: {
                        select: {
                            id: true,
                            name: true,
                            location: true,
                            user: {
                                select: {
                                    role: true
                                }
                            }
                        }
                    },
                    seller: {
                        select: {
                            id: true,
                            name: true,
                            location: true,
                            user: {
                                select: {
                                    role: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit)
            }),
            prisma_1.prisma.product.count({ where })
        ]);
        res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
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
        console.error("Get All Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve products",
            details: error instanceof Error ? error.message : "Unknown error occurred",
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getAllProducts = getAllProducts;
// Get Product by ID (Admin - View ANY product)
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma_1.prisma.product.findUnique({
            where: {
                id: id
            },
            include: {
                variants: true,
                categoryObj: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        description: true
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        description: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error("Get Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.getProductById = getProductById;
// Get Public Product by ID (Strict filters)
const getPublicProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma_1.prisma.product.findUnique({
            where: {
                id: id,
                status: "approved",
                OR: [
                    {
                        temple: {
                            user: {
                                isVerified: true,
                                role: { in: ['INSTITUTION', 'SELLER'] }
                            }
                        }
                    },
                    {
                        seller: {
                            user: {
                                isVerified: true
                            },
                            isActive: true
                        }
                    }
                ]
            },
            include: {
                variants: {
                    where: { stock: { gt: 0 } }
                },
                categoryObj: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        location: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found or not approved"
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error("Get Public Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.getPublicProductById = getPublicProductById;
// Update Product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Handle both JSON and FormData
        let name, description, category, categoryId, templeId, status, variants, image, removeImage;
        let highlights, longDescription, shippingInfo, origin, rating;
        if (req.is('multipart/form-data')) {
            // FormData handling
            name = req.body.name;
            description = req.body.description;
            category = req.body.category;
            categoryId = req.body.category || null; // Use category field as categoryId
            templeId = req.body.templeId || null;
            status = req.body.status;
            highlights = req.body.highlights;
            longDescription = req.body.longDescription;
            shippingInfo = req.body.shippingInfo;
            origin = req.body.origin;
            rating = req.body.rating ? parseFloat(req.body.rating) : undefined;
            // Parse variants from JSON string
            variants = req.body.variants ? JSON.parse(req.body.variants) : [];
            // Handle file upload
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
            // Handle image removal flag
            removeImage = req.body.removeImage === 'true';
        }
        else {
            // JSON handling
            const { name: productName, description: productDescription, category: productCategory, categoryId: productCategoryId, templeId: productTempleId, status: productStatus, variants: productVariants, highlights: productHighlights, longDescription: productLongDescription, shippingInfo: productShippingInfo, origin: productOrigin, rating: productRating } = req.body;
            name = productName;
            description = productDescription;
            category = productCategory;
            categoryId = productCategory || null; // Use category field as categoryId
            templeId = productTempleId || null;
            status = productStatus;
            variants = productVariants || [];
            highlights = productHighlights;
            longDescription = productLongDescription;
            shippingInfo = productShippingInfo;
            origin = productOrigin;
            rating = productRating;
        }
        // Check if product exists
        const existingProduct = await prisma_1.prisma.product.findUnique({
            where: { id: id },
            include: { variants: true }
        });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
                details: `Product with ID ${id} does not exist`
            });
        }
        // Validate required fields
        if (!name || !description || !category) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, description, category are required"
            });
        }
        const updateData = {};
        // Validate and handle categoryId
        if (categoryId) {
            const categoryRecord = await prisma_1.prisma.productCategory.findUnique({
                where: { id: categoryId }
            });
            if (!categoryRecord) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category",
                    details: `Category with ID ${categoryId} does not exist`
                });
            }
            updateData.categoryId = categoryId;
            updateData.category = categoryRecord.name; // Keep display name in sync
        }
        else if (category) {
            updateData.category = category;
        }
        // Smart Vendor Logic: Check if ID is Temple or Seller
        if (templeId && templeId !== "general") {
            // First check Temple
            const temple = await prisma_1.prisma.temple.findUnique({ where: { id: templeId } });
            if (temple) {
                updateData.templeId = temple.id;
                updateData.sellerId = null; // Clear seller if assigned to temple
            }
            else {
                // Then check Seller
                const seller = await prisma_1.prisma.sellerProfile.findUnique({ where: { id: templeId } });
                if (seller) {
                    updateData.sellerId = seller.id;
                    updateData.templeId = null; // Clear temple if assigned to seller
                }
                else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid vendor reference",
                        details: "The specified owner (Temple or Seller) does not exist"
                    });
                }
            }
        }
        else if (templeId === "general") {
            updateData.templeId = null;
            updateData.sellerId = null;
        }
        if (name)
            updateData.name = name;
        if (description)
            updateData.description = description;
        if (status)
            updateData.status = status;
        if (highlights !== undefined)
            updateData.highlights = highlights;
        if (longDescription !== undefined)
            updateData.longDescription = longDescription;
        if (shippingInfo !== undefined)
            updateData.shippingInfo = shippingInfo;
        if (origin !== undefined)
            updateData.origin = origin;
        if (rating !== undefined)
            updateData.rating = typeof rating === 'string' ? parseFloat(rating) : rating;
        if (image) {
            updateData.image = image;
        }
        else if (removeImage) {
            updateData.image = null;
        }
        // Handle variants update safely
        if (variants && Array.isArray(variants)) {
            // For now we keep the clear-and-create for simplicity but we'll catch relations error
            try {
                await prisma_1.prisma.productVariant.deleteMany({
                    where: { productId: id }
                });
                updateData.variants = {
                    create: variants.map((variant) => ({
                        name: variant.name,
                        price: parseFloat(variant.price),
                        stock: parseInt(variant.stock) || 0,
                        image: variant.image || null
                    }))
                };
            }
            catch (err) {
                console.warn("Could not delete variants due to existing relations:", err.message);
                // Fallback or handle appropriately if we had orders
            }
        }
        const updatedProduct = await prisma_1.prisma.product.update({
            where: { id: id },
            data: updateData,
            include: {
                variants: true,
                categoryObj: true,
                temple: true,
                seller: true
            }
        });
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });
    }
    catch (error) {
        console.error("Update Product Error:", error);
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: "Unique constraint violation",
                details: "A product with this name already exists or similar conflict."
            });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message: "Relationship error",
                details: "Could not update references or variants are tied to existing orders/carts."
            });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error while updating product",
            details: error.message
        });
    }
};
exports.updateProduct = updateProduct;
// Delete Product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if product exists
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: id }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        // Delete product (variants will be deleted due to cascade)
        await prisma_1.prisma.product.delete({
            where: { id: id }
        });
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.deleteProduct = deleteProduct;
// Toggle Product Status (Approve/Reject/Pending)
const toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be: pending, approved, or rejected"
            });
        }
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: id }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        const updatedProduct = await prisma_1.prisma.product.update({
            where: { id: id },
            data: { status },
            include: {
                variants: true,
                temple: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        user: {
                            select: {
                                role: true
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({
            success: true,
            message: `Product ${status} successfully`,
            data: updatedProduct
        });
    }
    catch (error) {
        console.error("Toggle Product Status Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.toggleProductStatus = toggleProductStatus;
// Get Products by Temple (for temple panel)
const getProductsByTemple = async (req, res) => {
    try {
        const { templeId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { templeId };
        if (status) {
            where.status = status;
        }
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                include: {
                    variants: true,
                    categoryObj: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    temple: {
                        select: {
                            id: true,
                            name: true,
                            location: true
                        }
                    }
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
        console.error("Get Products by Temple Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.getProductsByTemple = getProductsByTemple;
// Get Public Products (for landing page - only approved products)
const getPublicProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category, templeId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            status: "approved",
            OR: [
                {
                    temple: {
                        user: {
                            isVerified: true,
                            role: { in: ['INSTITUTION', 'SELLER'] }
                        }
                    }
                },
                {
                    seller: {
                        user: {
                            isVerified: true
                        },
                        isActive: true
                    }
                },
                {
                    AND: [
                        { templeId: null },
                        { sellerId: null }
                    ]
                }
            ]
        };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ];
        }
        if (category) {
            where.categoryObj = {
                name: { contains: category, mode: "insensitive" }
            };
        }
        if (templeId) {
            where.templeId = templeId;
        }
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                include: {
                    variants: {
                        where: { stock: { gt: 0 } } // Only show variants with stock
                    },
                    categoryObj: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    temple: {
                        select: {
                            id: true,
                            name: true,
                            location: true
                        }
                    },
                    seller: {
                        select: {
                            id: true,
                            name: true,
                            location: true
                        }
                    }
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
        console.error("Get Public Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.getPublicProducts = getPublicProducts;
// Get All Potential Product Owners (Temples & Sellers)
const getProductOwners = async (req, res) => {
    try {
        const [temples, sellers] = await Promise.all([
            prisma_1.prisma.temple.findMany({
                select: {
                    id: true,
                    name: true,
                    userId: true,
                    user: { select: { role: true } }
                }
            }),
            prisma_1.prisma.sellerProfile.findMany({
                select: {
                    id: true,
                    name: true,
                    userId: true,
                    user: { select: { role: true } }
                }
            })
        ]);
        const owners = [
            ...temples.map(t => ({
                id: t.id,
                name: t.name,
                type: 'Temple',
                userId: t.userId
            })),
            ...sellers.map(s => ({
                id: s.id,
                name: s.name,
                type: 'Seller',
                userId: s.userId
            }))
        ].sort((a, b) => a.name.localeCompare(b.name));
        res.status(200).json({
            success: true,
            data: owners
        });
    }
    catch (error) {
        console.error("Get Product Owners Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch owners",
            details: error.message
        });
    }
};
exports.getProductOwners = getProductOwners;
