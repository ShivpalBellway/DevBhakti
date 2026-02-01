import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get My Products
export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Get Temple ID
    const temple = await prisma.temple.findUnique({ where: { userId } });
    if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });

    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { templeId: temple.id };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } }
      ];
    }
    
    if (status) {
      where.status = status as string;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: true,
          categoryObj: { select: { name: true } }
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
    console.error("Get My Products Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get My Product by ID
export const getMyProductById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const temple = await prisma.temple.findUnique({ where: { userId } });
    if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });

    const product = await prisma.product.findFirst({
      where: { id, templeId: temple.id },
      include: {
        variants: true,
        categoryObj: { select: { id: true, name: true } },
        temple: { select: { id: true, name: true } }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Get My Product By ID Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create Product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const temple = await prisma.temple.findUnique({ where: { userId } });
    if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });

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
      if (req.file) image = `/uploads/products/${req.file.filename}`;
    } else {
        // Fallback for JSON
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

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        categoryId,
        templeId: temple.id,
        status: "pending", // Force Pending
        highlights,
        longDescription,
        shippingInfo,
        origin,
        image,
        variants: {
          create: variants.map((v: any) => ({
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

  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
  
      const temple = await prisma.temple.findUnique({ where: { userId } });
      if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });
  
      // Verify ownership
      const existingProduct = await prisma.product.findFirst({
        where: { id, templeId: temple.id }
      });
      if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found or access denied" });
  
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
        if (req.file) image = `/uploads/products/${req.file.filename}`;
        removeImage = req.body.removeImage === 'true';
      } else {
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
  
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (categoryId) updateData.categoryId = categoryId;
      if (highlights) updateData.highlights = highlights;
      if (longDescription) updateData.longDescription = longDescription;
      if (shippingInfo) updateData.shippingInfo = shippingInfo;
      if (origin) updateData.origin = origin;
      
      if (image) updateData.image = image;
      else if (removeImage) updateData.image = null;
  
      // Handle Variants
      if (variants && variants.length > 0) {
        await prisma.productVariant.deleteMany({ where: { productId: id } });
        updateData.variants = {
            create: variants.map((v: any) => ({
                name: v.name,
                price: parseFloat(v.price),
                stock: parseInt(v.stock) || 0,
                image: v.image || null
            }))
        };
      }
  
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { variants: true }
      });
  
      res.status(200).json({ success: true, data: updatedProduct });
  
    } catch (error) {
      console.error("Update Product Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const temple = await prisma.temple.findUnique({ where: { userId } });
        if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });

        const existingProduct = await prisma.product.findFirst({
            where: { id, templeId: temple.id }
        });
        if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found or access denied" });

        await prisma.product.delete({ where: { id } });

        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
