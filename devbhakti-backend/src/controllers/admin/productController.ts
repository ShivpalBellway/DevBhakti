import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create Product
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Handle both JSON and FormData
    let name, description, category, templeId, status, variants, image;
    
    if (req.is('multipart/form-data')) {
      // FormData handling
      name = req.body.name;
      description = req.body.description;
      category = req.body.category;
      templeId = req.body.templeId || null;
      status = req.body.status || "pending";
      
      // Parse variants from JSON string
      variants = req.body.variants ? JSON.parse(req.body.variants) : [];
      
      // Handle file upload
      if (req.file) {
        image = `/uploads/products/${req.file.filename}`;
      }
    } else {
      // JSON handling
      const { name: productName, description: productDescription, category: productCategory, templeId: productTempleId, status: productStatus = "pending", variants: productVariants } = req.body;
      
      name = productName;
      description = productDescription;
      category = productCategory;
      templeId = productTempleId || null;
      status = productStatus;
      variants = productVariants || [];
    }

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, description, category are required",
        details: {
          name: !name ? "Product name is required" : null,
          description: !description ? "Product description is required" : null,
          category: !category ? "Product category is required" : null,
          templeId: !templeId ? "Temple selection is optional for admin" : null
        }
      });
    }

    // If templeId is provided, check if temple exists
    if (templeId) {
      const temple = await prisma.temple.findUnique({
        where: { id: templeId }
      });

      if (!temple) {
        return res.status(404).json({
          success: false,
          message: "Temple not found",
          details: `Temple with ID ${templeId} does not exist`
        });
      }
    }

    // Validate variants
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product variant is required",
        details: "Products must have at least one variant with name and price"
      });
    }

    // Validate each variant
    const invalidVariants = variants.filter((variant: any) => 
      !variant.name || !variant.price || variant.price <= 0
    );

    if (invalidVariants.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant data found",
        details: "Each variant must have a name and a price greater than 0"
      });
    }

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        templeId: templeId || null, // Allow null for admin-created products
        status,
        image: image || null,
        variants: {
          create: variants.map((variant: any) => ({
            name: variant.name,
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock) || 0,
            image: variant.image || null
          }))
        }
      },
      include: {
        variants: true,
        temple: templeId ? {
          select: {
            id: true,
            name: true,
            location: true
          }
        } : false
      }
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
          success: false,
          message: "Product with this name already exists",
          details: error.message
        });
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return res.status(400).json({
          success: false,
          message: "Invalid temple reference",
          details: "The specified temple does not exist"
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while creating product",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get All Products (Admin)
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category, status, templeId } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } }
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
      prisma.product.findMany({
        where,
        include: {
          variants: true,
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
      prisma.product.count({ where })
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

// Get Product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        temple: {
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

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Handle both JSON and FormData
    let name, description, category, templeId, status, variants, image, removeImage;
    
    if (req.is('multipart/form-data')) {
      // FormData handling
      name = req.body.name;
      description = req.body.description;
      category = req.body.category;
      templeId = req.body.templeId || null;
      status = req.body.status;
      
      // Parse variants from JSON string
      variants = req.body.variants ? JSON.parse(req.body.variants) : [];
      
      // Handle file upload
      if (req.file) {
        image = `/uploads/products/${req.file.filename}`;
      }
      
      // Handle image removal flag
      removeImage = req.body.removeImage === 'true';
    } else {
      // JSON handling
      const { name: productName, description: productDescription, category: productCategory, templeId: productTempleId, status: productStatus, variants: productVariants } = req.body;
      
      name = productName;
      description = productDescription;
      category = productCategory;
      templeId = productTempleId || null;
      status = productStatus;
      variants = productVariants || [];
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
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
        message: "Missing required fields: name, description, category are required",
        details: {
          name: !name ? "Product name is required" : null,
          description: !description ? "Product description is required" : null,
          category: !category ? "Product category is required" : null
        }
      });
    }

    // If templeId is provided, check if temple exists
    if (templeId && templeId !== "general") {
      const temple = await prisma.temple.findUnique({
        where: { id: templeId }
      });

      if (!temple) {
        return res.status(404).json({
          success: false,
          message: "Temple not found",
          details: `Temple with ID ${templeId} does not exist`
        });
      }
    }

    // Validate variants
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product variant is required",
        details: "Products must have at least one variant with name and price"
      });
    }

    // Validate each variant
    const invalidVariants = variants.filter((variant: any) => 
      !variant.name || !variant.price || variant.price <= 0
    );

    if (invalidVariants.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant data found",
        details: "Each variant must have a name and a price greater than 0"
      });
    }

    // Update product basic info
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    if (templeId !== undefined) updateData.templeId = templeId === "general" ? null : templeId;
    
    // Handle image update
    if (image) {
      updateData.image = image;
    } else if (removeImage) {
      updateData.image = null;
    }

    // Handle variants update
    if (variants && Array.isArray(variants)) {
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: id }
      });

      // Create new variants
      updateData.variants = {
        create: variants.map((variant: any) => ({
          name: variant.name,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock) || 0,
          image: variant.image || null
        }))
      };
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        variants: true,
        temple: templeId ? {
          select: {
            id: true,
            name: true,
            location: true
          }
        } : false
      }
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
          success: false,
          message: "Product with this name already exists",
          details: error.message
        });
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return res.status(400).json({
          success: false,
          message: "Invalid temple reference",
          details: "The specified temple does not exist"
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while updating product",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Delete product (variants will be deleted due to cascade)
    await prisma.product.delete({
      where: { id }
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
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status },
      include: {
        variants: true,
        temple: {
          select: {
            id: true,
            name: true,
            location: true
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
    const { page = 1, limit = 10, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { templeId };
    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: true,
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
      prisma.product.count({ where })
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
    
    const where: any = { status: "approved" };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } }
      ];
    }
    
    if (category) {
      where.category = category;
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
      prisma.product.count({ where })
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
  } catch (error) {
    console.error("Get Public Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
