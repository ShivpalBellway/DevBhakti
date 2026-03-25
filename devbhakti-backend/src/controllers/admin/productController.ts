import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

// Create Product
export const createProduct = async (req: Request, res: Response) => {
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
        name: productName,
        description: productDescription,
        category: productCategory,
        categoryId: productCategoryId,
        templeId: productTempleId,
        status: productStatus = "pending",
        variants: productVariants,
        highlights: productHighlights,
        longDescription: productLongDescription,
        shippingInfo: productShippingInfo,
        origin: productOrigin,
        rating: productRating
      } = req.body;

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

    const createData: any = {
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
        create: variants.map((variant: any) => ({
          name: variant.name,
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
        createData.category = categoryRecord.name;
      } else {
        createData.category = category;
      }
    } else {
      createData.category = category;
    }

    // Handle Vendor (Temple or Seller)
    if (templeId && templeId !== "general") {
      // Check Temple
      const temple = await prisma.temple.findUnique({ where: { id: templeId as string } });
      if (temple) {
        createData.templeId = temple.id;
      } else {
        // Check Seller
        const seller = await prisma.sellerProfile.findUnique({ where: { id: templeId as string } });
        if (seller) {
          createData.sellerId = seller.id;
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid vendor reference",
            details: "The specified owner (Temple or Seller) does not exist"
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
    const { page = 1, limit = 10, search, category, status, templeId, date, productId } = req.query;

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
          { name: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } }
        ]
      });
    }

    if (category) {
      where.AND.push({ category });
    }

    if (status) {
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

    const [products, total, pendingCount, approvedCount, totalCount] = await Promise.all([
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
      prisma.product.count()
    ]);

    let finalProducts = products;

    // Rank results if searching
    if (search) {
      const lowQuery = String(search).toLowerCase();
      finalProducts.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

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
      message: "Products retrieved successfully",
      data: {
        products: finalProducts,
        stats: {
          total: totalCount,
          pending: pendingCount,
          approved: approvedCount
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

    res.status(200).json({
      success: true,
      data: product
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
        name: productName,
        description: productDescription,
        category: productCategory,
        categoryId: productCategoryId,
        templeId: productTempleId,
        status: productStatus,
        variants: productVariants,
        highlights: productHighlights,
        longDescription: productLongDescription,
        shippingInfo: productShippingInfo,
        origin: productOrigin,
        rating: productRating
      } = req.body;

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
    const existingProduct = await prisma.product.findUnique({
      where: { id: id as string },
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

    const updateData: any = {};

    // Validate and handle categoryId
    if (categoryId) {
      const categoryRecord = await prisma.productCategory.findUnique({
        where: { id: categoryId as string }
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
    } else if (category) {
      updateData.category = category as string;
    }

    // Smart Vendor Logic: Check if ID is Temple or Seller
    if (templeId && templeId !== "general") {
      // First check Temple
      const temple = await prisma.temple.findUnique({ where: { id: templeId as string } });
      if (temple) {
        updateData.templeId = temple.id;
        updateData.sellerId = null; // Clear seller if assigned to temple
      } else {
        // Then check Seller
        const seller = await prisma.sellerProfile.findUnique({ where: { id: templeId as string } });
        if (seller) {
          updateData.sellerId = seller.id;
          updateData.templeId = null; // Clear temple if assigned to seller
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid vendor reference",
            details: "The specified owner (Temple or Seller) does not exist"
          });
        }
      }
    } else if (templeId === "general") {
      updateData.templeId = null;
      updateData.sellerId = null;
    }

    if (name) updateData.name = name as string;
    if (description) updateData.description = description as string;
    if (status) updateData.status = status as string;
    if (highlights !== undefined) updateData.highlights = highlights as string;
    if (longDescription !== undefined) updateData.longDescription = longDescription as string;
    if (shippingInfo !== undefined) updateData.shippingInfo = shippingInfo as string;
    if (origin !== undefined) updateData.origin = origin as string;
    if (rating !== undefined) updateData.rating = typeof rating === 'string' ? parseFloat(rating) : rating;

    if (image) {
      updateData.image = image as string;
    } else if (removeImage) {
      updateData.image = null;
    }

    // Handle variants update safely
    if (variants && Array.isArray(variants)) {
      // For now we keep the clear-and-create for simplicity but we'll catch relations error
      try {
        await prisma.productVariant.deleteMany({
          where: { productId: id as string }
        });

        updateData.variants = {
          create: variants.map((variant: any) => ({
            name: variant.name,
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock) || 0,
            image: variant.image || null
          }))
        };
      } catch (err: any) {
        console.warn("Could not delete variants due to existing relations:", err.message);
        // Fallback or handle appropriately if we had orders
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

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: id as string }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Delete product (variants will be deleted due to cascade)
    await prisma.product.delete({
      where: { id: id as string }
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
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
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
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
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

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
        products: finalProducts,
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
    const { page = 1, limit = 10, search, category, templeId } = req.query;

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
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } }
      ];
    }

    if (category) {
      where.categoryObj = {
        name: { contains: category as string, mode: "insensitive" }
      };
    }

    if (templeId) {
      where.templeId = templeId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

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
        products: finalProducts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
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
  } catch (error: any) {
    console.error("Get Product Owners Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch owners",
      details: error.message
    });
  }
};
