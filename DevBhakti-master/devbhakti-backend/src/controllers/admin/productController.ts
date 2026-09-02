import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { localize, buildLangJson, buildLangArray, getLang, getEnglish } from "../../utils/localization";

// Create Product
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Handle both JSON and FormData
    let name_en, name_hi, name_mr;
    let description_en, description_hi, description_mr;
    let category_en, category_hi, category_mr;
    let highlights_en, highlights_hi, highlights_mr;
    let longDescription_en, longDescription_hi, longDescription_mr;
    let shippingInfo_en, shippingInfo_hi, shippingInfo_mr;
    let origin_en, origin_hi, origin_mr;
    
    let categoryId, templeId, status, variants, image, rating;

    if (req.is('multipart/form-data')) {
      // FormData handling
      name_en = req.body.name_en || req.body.name; // Fallback to "name" if frontend isn't updated yet
      name_hi = req.body.name_hi;
      name_mr = req.body.name_mr;

      description_en = req.body.description_en || req.body.description;
      description_hi = req.body.description_hi;
      description_mr = req.body.description_mr;

      category_en = req.body.category_en || req.body.category;
      category_hi = req.body.category_hi;
      category_mr = req.body.category_mr;

      highlights_en = req.body.highlights_en || req.body.highlights;
      highlights_hi = req.body.highlights_hi;
      highlights_mr = req.body.highlights_mr;

      longDescription_en = req.body.longDescription_en || req.body.longDescription;
      longDescription_hi = req.body.longDescription_hi;
      longDescription_mr = req.body.longDescription_mr;

      shippingInfo_en = req.body.shippingInfo_en || req.body.shippingInfo;
      shippingInfo_hi = req.body.shippingInfo_hi;
      shippingInfo_mr = req.body.shippingInfo_mr;

      origin_en = req.body.origin_en || req.body.origin;
      origin_hi = req.body.origin_hi;
      origin_mr = req.body.origin_mr;

      categoryId = req.body.categoryId || req.body.category || null;
      templeId = req.body.templeId || null;
      
      // Handle templeId if it's an array (take first element)
      if (Array.isArray(templeId)) {
        templeId = templeId[0];
      }
      
      status = req.body.status || "pending";
      rating = req.body.rating ? parseFloat(req.body.rating) : undefined;

      // Parse variants from JSON string
      variants = req.body.variants ? JSON.parse(req.body.variants) : [];

      // Handle file upload
      const files = req.files as Express.Multer.File[];
      if (files) {
        const productFile = files.find(f => f.fieldname === 'image');
        if (productFile) image = `/uploads/products/${productFile.filename}`;

        variants = variants.map((v: any, index: number) => {
          const variantFile = files.find(f => f.fieldname === `variant_image_${index}`);
          if (variantFile) v.image = `/uploads/products/${variantFile.filename}`;
          return v;
        });
      }
    } else {
      // JSON handling
      const {
        name_en: nEn, name_hi: nHi, name_mr: nMr,
        description_en: dEn, description_hi: dHi, description_mr: dMr,
        category_en: cEn, category_hi: cHi, category_mr: cMr,
        highlights_en: hEn, highlights_hi: hHi, highlights_mr: hMr,
        longDescription_en: ldEn, longDescription_hi: ldHi, longDescription_mr: ldMr,
        shippingInfo_en: sEn, shippingInfo_hi: sHi, shippingInfo_mr: sMr,
        origin_en: oEn, origin_hi: oHi, origin_mr: oMr,
        categoryId: productCategoryId,
        templeId: productTempleId,
        status: productStatus = "pending",
        variants: productVariants,
        rating: productRating
      } = req.body;

      name_en = nEn || req.body.name;
      name_hi = nHi;
      name_mr = nMr;
      description_en = dEn || req.body.description;
      description_hi = dHi;
      description_mr = dMr;
      category_en = cEn || req.body.category;
      category_hi = cHi;
      category_mr = cMr;
      highlights_en = hEn || req.body.highlights;
      highlights_hi = hHi;
      highlights_mr = hMr;
      longDescription_en = ldEn || req.body.longDescription;
      longDescription_hi = ldHi;
      longDescription_mr = ldMr;
      shippingInfo_en = sEn || req.body.shippingInfo;
      shippingInfo_hi = sHi;
      shippingInfo_mr = sMr;
      origin_en = oEn || req.body.origin;
      origin_hi = oHi;
      origin_mr = oMr;

      categoryId = productCategoryId || req.body.category || null;
      templeId = productTempleId || null;
      
      // Handle templeId if it's an array (take first element)
      if (Array.isArray(templeId)) {
        templeId = templeId[0];
      } else if (templeId === "general") {
        templeId = null;
      }
      
      status = productStatus;
      variants = productVariants || [];
      rating = productRating;
    }

    // Validate required fields (English is mandatory)
    if (!name_en || !description_en || !category_en) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name_en, description_en, category_en are required"
      });
    }

    const createData: any = {
      name: buildLangJson(name_en || req.body.name, name_hi, name_mr),
      description: buildLangJson(description_en || req.body.description, description_hi, description_mr),
      category: buildLangJson(category_en || req.body.category, category_hi, category_mr),
      highlights: buildLangJson(highlights_en || req.body.highlights, highlights_hi, highlights_mr),
      longDescription: buildLangJson(longDescription_en || req.body.longDescription, longDescription_hi, longDescription_mr),
      shippingInfo: buildLangJson(shippingInfo_en || req.body.shippingInfo, shippingInfo_hi, shippingInfo_mr),
      origin: buildLangJson(origin_en || req.body.origin, origin_hi, origin_mr),
      status,
      rating,
      image: image || null,
      variants: {
        create: variants.map((variant: any) => ({
          name: buildLangJson(variant.name_en || variant.name, variant.name_hi, variant.name_mr),
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock) || 0,
          image: variant.image || null
        }))
      }
    };

    // Handle Category
    if (categoryId) {
      const categoryRecord = await prisma.productCategory.findUnique({ where: { id: categoryId as string } });
      if (categoryRecord) {
        createData.categoryId = categoryId;
      }
    }

    // Handle Vendor (Temple or Seller)
    if (templeId && templeId !== "general") {
      const dbTemple = await prisma.temple.findUnique({ where: { id: templeId as string } });
      if (dbTemple) {
        createData.templeId = dbTemple.id;
      } else {
        const seller = await prisma.sellerProfile.findUnique({ where: { id: templeId as string } });
        if (seller) {
          createData.sellerId = seller.id;
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid vendor reference"
          });
        }
      }
    }

    // Create product
    const product = await prisma.product.create({
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
  } catch (error: any) {
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

// Get All Products (Admin)
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category, categoryId, status, templeId, date, productId } = req.query;

    const skip = search ? 0 : (Number(page) - 1) * Number(limit);
    const take = search ? 100 : Number(limit);

    // Build where clause
    const where: any = { AND: [] };

    if (productId) {
      where.AND.push({ id: productId as string });
    }

    if (search) {
      where.AND.push({
        OR: [
          { name: { path: ['en'], string_contains: String(search), mode: 'insensitive' } },
          { name: { path: ['hi'], string_contains: String(search), mode: 'insensitive' } },
          { name: { path: ['mr'], string_contains: String(search), mode: 'insensitive' } },
          { description: { path: ['en'], string_contains: String(search), mode: 'insensitive' } }
        ]
      });
    }

    // Filter by categoryId (from the Category dropdown — uses DB category record ID)
    if (categoryId) {
      where.AND.push({ categoryId: categoryId as string });
    } else if (category) {
      // Legacy text-based category filter
      where.AND.push({ category });
    }

    if (status === "out_of_stock") {
      where.AND.push({
        variants: {
          every: {
            stock: 0
          }
        }
      });
    } else if (status) {
      where.AND.push({ status });
    }

    if (templeId) {
      if (templeId === "admin") {
        where.AND.push({ templeId: null });
        where.AND.push({ sellerId: null });
      } else {
        where.AND.push({
          OR: [
            { templeId: templeId as string },
            { sellerId: templeId as string }
          ]
        });
      }
    }

    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
      where.AND.push({
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      });
    }

    // Remove empty AND if no filters
    if (where.AND.length === 0) delete where.AND;

    const [products, total, pendingCount, approvedCount, outOfStockCount, totalCount] = await Promise.all([
      prisma.product.findMany({
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
        take
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: { status: 'pending' } }),
      prisma.product.count({ where: { status: 'approved' } }),
      prisma.product.count({ where: { variants: { every: { stock: 0 } } } }),
      prisma.product.count()
    ]);

    let finalProducts = products;

    // Rank results if searching
    if (search) {
      const lowQuery = String(search).toLowerCase();
      finalProducts.sort((a, b) => {
        const nameA = getEnglish(a.name).toLowerCase();
        const nameB = getEnglish(b.name).toLowerCase();

        // Exact match priority
        if (nameA === lowQuery && nameB !== lowQuery) return -1;
        if (nameB === lowQuery && nameA !== lowQuery) return 1;

        // Starts with match priority
        if (nameA.startsWith(lowQuery) && !nameB.startsWith(lowQuery)) return -1;
        if (nameB.startsWith(lowQuery) && !nameA.startsWith(lowQuery)) return 1;

        return 0;
      });

      // After ranking, apply pagination manually if searching
      const start = (Number(page) - 1) * Number(limit);
      finalProducts = finalProducts.slice(start, start + Number(limit));
    }

    const lang = getLang(req);
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: {
        products: localize(finalProducts, lang),
        stats: {
          total: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          outOfStock: outOfStockCount
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get All Products Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get Product by ID (Admin - View ANY product)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: id as string
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

    const lang = getLang(req);
    res.status(200).json({
      success: true,
      data: lang === 'raw' ? product : localize(product, lang)
    });
  } catch (error) {
    console.error("Get Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get Public Product by ID (Strict filters)
export const getPublicProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: id as string,
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
      },
      include: {
        variants: {
          where: { isActive: true }
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

    const lang = getLang(req);
    res.status(200).json({
      success: true,
      data: localize(product, lang)
    });
  } catch (error) {
    console.error("Get Public Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Handle both JSON and FormData
    let name_en, name_hi, name_mr;
    let description_en, description_hi, description_mr;
    let category_en, category_hi, category_mr;
    let highlights_en, highlights_hi, highlights_mr;
    let longDescription_en, longDescription_hi, longDescription_mr;
    let shippingInfo_en, shippingInfo_hi, shippingInfo_mr;
    let origin_en, origin_hi, origin_mr;

    let categoryId, templeId, status, variants, image, removeImage, rating;

    if (req.is('multipart/form-data')) {
      // FormData handling
      name_en = req.body.name_en || req.body.name;
      name_hi = req.body.name_hi;
      name_mr = req.body.name_mr;

      description_en = req.body.description_en || req.body.description;
      description_hi = req.body.description_hi;
      description_mr = req.body.description_mr;

      category_en = req.body.category_en || req.body.category;
      category_hi = req.body.category_hi;
      category_mr = req.body.category_mr;

      highlights_en = req.body.highlights_en || req.body.highlights;
      highlights_hi = req.body.highlights_hi;
      highlights_mr = req.body.highlights_mr;

      longDescription_en = req.body.longDescription_en || req.body.longDescription;
      longDescription_hi = req.body.longDescription_hi;
      longDescription_mr = req.body.longDescription_mr;

      shippingInfo_en = req.body.shippingInfo_en || req.body.shippingInfo;
      shippingInfo_hi = req.body.shippingInfo_hi;
      shippingInfo_mr = req.body.shippingInfo_mr;

      origin_en = req.body.origin_en || req.body.origin;
      origin_hi = req.body.origin_hi;
      origin_mr = req.body.origin_mr;

      categoryId = req.body.categoryId || req.body.category || null;
      templeId = req.body.templeId || null;
      status = req.body.status;
      rating = req.body.rating ? parseFloat(req.body.rating) : undefined;

      // Parse variants from JSON string
      variants = req.body.variants ? JSON.parse(req.body.variants) : [];

      // Handle file upload
      const files = req.files as Express.Multer.File[];
      if (files) {
        const productFile = files.find(f => f.fieldname === 'image');
        if (productFile) image = `/uploads/products/${productFile.filename}`;

        variants = variants.map((v: any, index: number) => {
          const variantFile = files.find(f => f.fieldname === `variant_image_${index}`);
          if (variantFile) v.image = `/uploads/products/${variantFile.filename}`;
          return v;
        });
      }

      // Handle image removal flag
      removeImage = req.body.removeImage === 'true';
    } else {
      // JSON handling
      const {
        name_en: nEn, name_hi: nHi, name_mr: nMr,
        description_en: dEn, description_hi: dHi, description_mr: dMr,
        category_en: cEn, category_hi: cHi, category_mr: cMr,
        highlights_en: hEn, highlights_hi: hHi, highlights_mr: hMr,
        longDescription_en: ldEn, longDescription_hi: ldHi, longDescription_mr: ldMr,
        shippingInfo_en: sEn, shippingInfo_hi: sHi, shippingInfo_mr: sMr,
        origin_en: oEn, origin_hi: oHi, origin_mr: oMr,
        categoryId: productCategoryId,
        templeId: productTempleId,
        status: productStatus,
        variants: productVariants,
        rating: productRating
      } = req.body;

      name_en = nEn || req.body.name;
      name_hi = nHi;
      name_mr = nMr;
      description_en = dEn || req.body.description;
      description_hi = dHi;
      description_mr = dMr;
      category_en = cEn || req.body.category;
      category_hi = cHi;
      category_mr = cMr;
      highlights_en = hEn || req.body.highlights;
      highlights_hi = hHi;
      highlights_mr = hMr;
      longDescription_en = ldEn || req.body.longDescription;
      longDescription_hi = ldHi;
      longDescription_mr = ldMr;
      shippingInfo_en = sEn || req.body.shippingInfo;
      shippingInfo_hi = sHi;
      shippingInfo_mr = sMr;
      origin_en = oEn || req.body.origin;
      origin_hi = oHi;
      origin_mr = oMr;

      categoryId = productCategoryId || req.body.category || null;
      templeId = productTempleId || null;
      status = productStatus;
      variants = productVariants || [];
      rating = productRating;
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: id as string },
      include: { variants: true }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const updateData: any = {};

    // Validate and handle categoryId
    if (categoryId) {
      const categoryRecord = await prisma.productCategory.findUnique({
        where: { id: categoryId as string }
      });
      if (categoryRecord) {
        updateData.categoryId = categoryId;
      }
    }

    // Vendor Logic
    if (templeId && templeId !== "general") {
      const dbTemple = await prisma.temple.findUnique({ where: { id: templeId as string } });
      if (dbTemple) {
        updateData.templeId = dbTemple.id;
        updateData.sellerId = null;
      } else {
        const seller = await prisma.sellerProfile.findUnique({ where: { id: templeId as string } });
        if (seller) {
          updateData.sellerId = seller.id;
          updateData.templeId = null;
        }
      }
    } else if (templeId === "general") {
      updateData.templeId = null;
      updateData.sellerId = null;
    }

    if (name_en) updateData.name = buildLangJson(name_en, name_hi, name_mr);
    if (description_en) updateData.description = buildLangJson(description_en, description_hi, description_mr);
    if (category_en) updateData.category = buildLangJson(category_en, category_hi, category_mr);
    if (highlights_en !== undefined) updateData.highlights = buildLangJson(highlights_en, highlights_hi, highlights_mr);
    if (longDescription_en !== undefined) updateData.longDescription = buildLangJson(longDescription_en, longDescription_hi, longDescription_mr);
    if (shippingInfo_en !== undefined) updateData.shippingInfo = buildLangJson(shippingInfo_en, shippingInfo_hi, shippingInfo_mr);
    if (origin_en !== undefined) updateData.origin = buildLangJson(origin_en, origin_hi, origin_mr);

    if (status) updateData.status = status;
    if (rating !== undefined) updateData.rating = typeof rating === 'string' ? parseFloat(rating) : rating;

    if (image) {
      updateData.image = image;
    } else if (removeImage) {
      updateData.image = null;
    }

    // Handle variants update safely
    if (variants && Array.isArray(variants)) {
      try {
        const existingVariants = variants.filter((v: any) => v.id && String(v.id).length > 20);
        const newVariants = variants.filter((v: any) => !v.id || String(v.id).length <= 20);
        const existingIds = existingVariants.map((v: any) => v.id);

        updateData.variants = {
          updateMany: {
            where: { id: { notIn: existingIds } },
            data: { isActive: false }
          },
          update: existingVariants.map((variant: any) => ({
            where: { id: variant.id },
            data: {
              name: buildLangJson(variant.name_en || variant.name, variant.name_hi, variant.name_mr),
              price: parseFloat(variant.price),
              stock: parseInt(variant.stock) || 0,
              ...(variant.hasOwnProperty('image') && { image: variant.image }), // update image including null
              isActive: true // ensure it's active
            }
          })),
          create: newVariants.map((variant: any) => ({
            name: buildLangJson(variant.name_en || variant.name, variant.name_hi, variant.name_mr),
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock) || 0,
            image: variant.image || null,
            isActive: true
          }))
        };
      } catch (err: any) {
        console.warn("Could not update variants:", err.message);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id as string },
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
  } catch (error: any) {
    console.error("Update Product Error:", error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: "Unique constraint violation",
        details: "A product with this name already exists or similar conflict."
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while updating product",
      details: error.message
    });
  }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists and check for dependencies
    const product = await prisma.product.findUnique({
      where: { id: id as string },
      include: {
        _count: {
          select: {
            orderItems: true,
            cartItems: true
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

    // Check if product has orders
    if (product._count.orderItems > 0) {
      return res.status(400).json({
        success: false,
        message: "This product has associated orders and cannot be deleted. Try deactivating it instead to keep transaction history intact.",
        details: "Product is linked to " + product._count.orderItems + " order items."
      });
    }

    // If it has cart items, we can either block or delete them. 
    // Usually it's better to block or delete cart items since they aren't final orders.
    // For safety, let's block and tell user to try again or we can clean it up.
    if (product._count.cartItems > 0) {
        // Option A: Clean up cart items
        await prisma.cartItem.deleteMany({
            where: { productId: id as string }
        });
    }

    // Delete product (variants will be deleted due to cascade in schema)
    await prisma.product.delete({
      where: { id: id as string }
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    
    if (error.code === 'P2003') {
        return res.status(400).json({
            success: false,
            message: "Cannot delete product due to existing database dependencies.",
            details: "Please ensure all associated records are cleared or deactivated instead."
        });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Toggle Product Status (Approve/Reject/Pending)
export const toggleProductStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: pending, approved, or rejected"
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: id as string }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id as string },
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
  } catch (error) {
    console.error("Toggle Product Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get Products by Temple (for temple panel)
export const getProductsByTemple = async (req: Request, res: Response) => {
  try {
    const { templeId } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { templeId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { path: ['en'], string_contains: String(search) } },
        { description: { path: ['en'], string_contains: String(search) } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
        take: search ? 100 : Number(limit),
        skip: search ? 0 : (Number(page) - 1) * Number(limit)
      }),
      prisma.product.count({ where })
    ]);

    let finalProducts = products;

    // Rank results if searching
    if (search) {
      const lowQuery = String(search).toLowerCase();
      finalProducts.sort((a, b) => {
        const nameA = getEnglish(a.name).toLowerCase();
        const nameB = getEnglish(b.name).toLowerCase();

        // Exact match priority
        if (nameA === lowQuery && nameB !== lowQuery) return -1;
        if (nameB === lowQuery && nameA !== lowQuery) return 1;

        // Starts with match priority
        if (nameA.startsWith(lowQuery) && !nameB.startsWith(lowQuery)) return -1;
        if (nameB.startsWith(lowQuery) && !nameA.startsWith(lowQuery)) return 1;

        return 0;
      });

      // After ranking, apply pagination manually if searching
      const start = (Number(page) - 1) * Number(limit);
      finalProducts = finalProducts.slice(start, start + Number(limit));
    }

    res.status(200).json({
      success: true,
      data: {
        products: localize(finalProducts, getLang(req)),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get Products by Temple Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get Public Products (for landing page - only approved products)
export const getPublicProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category, templeId, mandalId, minPrice, maxPrice, sort } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
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
          mandal: {
            isActive: true
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
            { sellerId: null },
            { mandalId: null }
          ]
        }
      ]
    };

    if (minPrice || maxPrice) {
      where.variants = {
        some: {
          price: {
            gte: minPrice ? parseFloat(minPrice as string) : undefined,
            lte: maxPrice ? parseFloat(maxPrice as string) : undefined
          },
          isActive: true
        }
      };
    }

    if (mandalId) {
      where.mandalId = String(mandalId);
      delete where.OR;
    } else if (templeId) {
      where.templeId = String(templeId);
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === 'price_asc') {
      orderBy = { variants: { _count: 'desc' } }; // This is hacky, actual sort by min variant price is complex in Prisma findMany
      // Better way: use raw query or handle in JS if results are small. 
      // But for Prisma findMany, we can't easily sort by a child aggregation in one go without complex selection.
      // However, usually we can sort by the price of the first variant.
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: {
            where: { isActive: true },
            orderBy: { price: "asc" } 
          },
          categoryObj: {
            select: {
              id: true,
              name: true,
              description: true,
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
        orderBy: sort === 'price_asc' || sort === 'price_desc' 
          ? undefined // We will sort manually if it's price-based for accuracy across variants
          : { createdAt: "desc" },
        take: search || sort === 'price_asc' || sort === 'price_desc' ? 100 : Number(limit),
        skip: search || sort === 'price_asc' || sort === 'price_desc' ? 0 : (Number(page) - 1) * Number(limit)
      }),
      prisma.product.count({ where })
    ]);

    const lang = getLang(req);
    let finalProducts = products.map(p => localize(p, lang));

    // Robust JS-based Filtering (Case-Insensitive & Multi-Language)
    if (search || category) {
      const lowSearch = search ? String(search).toLowerCase() : "";
      const lowCategory = category ? String(category).toLowerCase() : "";

      finalProducts = finalProducts.filter(p => {
        let matchesSearch = true;
        let matchesCategory = true;

        if (lowSearch) {
          const nameEn = String(p.name_en || p.name?.en || "").toLowerCase();
          const nameHi = String(p.name_hi || p.name?.hi || "").toLowerCase();
          const nameMr = String(p.name_mr || p.name?.mr || "").toLowerCase();
          const descEn = String(p.description_en || p.description?.en || "").toLowerCase();
          
          matchesSearch = nameEn.includes(lowSearch) || 
                          nameHi.includes(lowSearch) || 
                          nameMr.includes(lowSearch) ||
                          descEn.includes(lowSearch);
        }

        if (lowCategory) {
          const catNameEn = String(p.categoryObj?.name?.en || p.category || "").toLowerCase();
          const catNameHi = String(p.categoryObj?.name?.hi || "").toLowerCase();
          const catNameMr = String(p.categoryObj?.name?.mr || "").toLowerCase();
          
          matchesCategory = catNameEn.includes(lowCategory) || 
                            catNameHi.includes(lowCategory) || 
                            catNameMr.includes(lowCategory);
        }

        return matchesSearch && matchesCategory;
      });
    }

    // Support for Price Sorting and Search Ranking
    finalProducts.sort((a: any, b: any) => {
      if (sort === 'price_asc' || sort === 'price_desc') {
        const priceA = a.variants?.[0]?.price || 0;
        const priceB = b.variants?.[0]?.price || 0;
        return sort === 'price_asc' ? priceA - priceB : priceB - priceA;
      }

      if (search) {
        const lowQuery = String(search).toLowerCase();
        const nameA = String(a.name || "").toLowerCase();
        const nameB = String(b.name || "").toLowerCase();
        if (nameA === lowQuery && nameB !== lowQuery) return -1;
        if (nameB === lowQuery && nameA !== lowQuery) return 1;
      }
      return 0;
    });

    const filteredTotal = finalProducts.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedProducts = finalProducts.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredTotal,
          pages: Math.ceil(filteredTotal / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get Public Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get All Potential Product Owners (Temples & Sellers)
export const getProductOwners = async (req: Request, res: Response) => {
  try {
    const [temples, sellers] = await Promise.all([
      prisma.temple.findMany({
        select: {
          id: true,
          name: true,
          userId: true,
          user: { select: { role: true } }
        }
      }),
      prisma.sellerProfile.findMany({
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
        name: getEnglish(t.name),
        type: 'Temple',
        userId: t.userId
      })),
      ...sellers.map(s => ({
        id: s.id,
        name: getEnglish(s.name),
        type: 'Seller',
        userId: s.userId
      }))
    ].sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      data: owners
    });
  } catch (error: any) {
    console.error("Get Product Owners Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch owners",
      details: error.message
    });
  }
};
