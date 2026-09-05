import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { getLang, localize, buildLangJson } from "../../utils/localization";

// Get My Products
export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;

    const { page = 1, limit = 10, search, status, categoryId, stockStatus } = req.query;
    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

    const where: any = { mandalId };

    if (search) {
      where.OR = [
        { name: { path: ['en'], string_contains: search as string } },
        { description: { path: ['en'], string_contains: search as string } }
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId as string;
    }

    if (stockStatus === 'out_of_stock') {
      where.variants = {
        every: { stock: 0 }
      };
    } else if (stockStatus === 'in_stock') {
      where.variants = {
        some: { stock: { gt: 0 } }
      };
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
        take: parseInt(String(limit), 10)
      }),
      prisma.product.count({ where })
    ]);

    const lang = getLang(req);
    res.status(200).json({
      success: true,
      data: {
        products: localize(products, lang),
        pagination: {
          page: parseInt(String(page), 10),
          limit: parseInt(String(limit), 10),
          total,
          pages: Math.ceil(total / parseInt(String(limit), 10))
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
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id: id as string, mandalId },
      include: {
        variants: true,
        categoryObj: { select: { id: true, name: true } },
        mandal: { select: { id: true, name: true } }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const lang = getLang(req);
    res.status(200).json({ success: true, data: localize(product, lang) });
  } catch (error) {
    console.error("Get My Product By ID Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create Product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;

    let data = req.body;
    let image;
    let variants = [];

    if (req.is('multipart/form-data')) {
      const tryParseVariants = (val: any) => {
        if (typeof val !== 'string') return val;
        try { return JSON.parse(val); } catch (e) { return []; }
      };
      variants = data.variants ? tryParseVariants(data.variants) : [];
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
      variants = data.variants || [];
    }

    const { 
        name_en, name_hi, name_mr,
        description_en, description_hi, description_mr,
        category, 
        category_en, category_hi, category_mr,
        highlights_en, highlights_hi, highlights_mr,
        longDescription_en, longDescription_hi, longDescription_mr,
        shippingInfo_en, shippingInfo_hi, shippingInfo_mr,
        origin_en, origin_hi, origin_mr
    } = data;

    const tryParse = (val: any) => {
        if (typeof val !== 'string') return val;
        if (!val || (!val.trim().startsWith('[') && !val.trim().startsWith('{'))) return val;
        try { return JSON.parse(val); } catch (e) { return val; }
    };

    const product = await prisma.product.create({
      data: {
        name: buildLangJson(name_en || data.name, name_hi, name_mr),
        description: buildLangJson(description_en || data.description, description_hi, description_mr),
        category: buildLangJson(category_en || category, category_hi, category_mr),
        highlights: buildLangJson(
            tryParse(highlights_en),
            tryParse(highlights_hi),
            tryParse(highlights_mr)
        ),
        longDescription: buildLangJson(longDescription_en, longDescription_hi, longDescription_mr),
        shippingInfo: buildLangJson(shippingInfo_en, shippingInfo_hi, shippingInfo_mr),
        origin: buildLangJson(origin_en, origin_hi, origin_mr),
        categoryId: category,
        mandalId: mandalId,
        status: "pending",
        image,
        variants: {
          create: variants.map((v: any) => ({
            name: buildLangJson(v.name_en || v.name || v.name_en, v.name_hi, v.name_mr),
            price: parseFloat(v.price) || 0,
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
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;

    // Verify ownership
    const existingProduct = await prisma.product.findFirst({
      where: { id: id as string, mandalId }
    });
    if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found or access denied" });

    let data = req.body;
    let variants, image;
    const updateData: any = {};

    if (req.is('multipart/form-data')) {
        const tryParseVariants = (val: any) => {
            if (typeof val !== 'string') return val;
            try { return JSON.parse(val); } catch (e) { return []; }
        };
        variants = data.variants ? tryParseVariants(data.variants) : [];
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
        variants = data.variants || [];
    }

    const { 
        name_en, name_hi, name_mr,
        description_en, description_hi, description_mr,
        category_en, category_hi, category_mr,
        category: categoryId,
        highlights_en, highlights_hi, highlights_mr,
        longDescription_en, longDescription_hi, longDescription_mr,
        shippingInfo_en, shippingInfo_hi, shippingInfo_mr,
        origin_en, origin_hi, origin_mr,
        removeImage
    } = data;

    if (name_en !== undefined) updateData.name = buildLangJson(name_en || data.name, name_hi, name_mr);
    if (description_en !== undefined) updateData.description = buildLangJson(description_en || data.description, description_hi, description_mr);
    if (category_en !== undefined) updateData.category = buildLangJson(category_en, category_hi, category_mr);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    
    if (highlights_en !== undefined) {
        const tryParse = (val: any) => {
            if (typeof val !== 'string') return val;
            if (!val.trim().startsWith('[') && !val.trim().startsWith('{')) return val;
            try { return JSON.parse(val); } catch (e) { return val; }
        };
        updateData.highlights = buildLangJson(
            tryParse(highlights_en),
            tryParse(highlights_hi),
            tryParse(highlights_mr)
        );
    }

    if (longDescription_en !== undefined) updateData.longDescription = buildLangJson(longDescription_en, longDescription_hi, longDescription_mr);
    if (shippingInfo_en !== undefined) updateData.shippingInfo = buildLangJson(shippingInfo_en, shippingInfo_hi, shippingInfo_mr);
    if (origin_en !== undefined) updateData.origin = buildLangJson(origin_en, origin_hi, origin_mr);

    if (image) updateData.image = image;
    else if (removeImage === 'true') updateData.image = null;

    // Handle Variants
    if (variants && Array.isArray(variants)) {
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
            name: buildLangJson(variant.name_en || variant.name || variant.name_en, variant.name_hi, variant.name_mr),
            price: parseFloat(variant.price) || 0,
            stock: parseInt(variant.stock) || 0,
            ...(variant.hasOwnProperty('image') && { image: variant.image }),
            isActive: true
          }
        })),
        create: newVariants.map((variant: any) => ({
          name: buildLangJson(variant.name_en || variant.name || variant.name_en, variant.name_hi, variant.name_mr),
          price: parseFloat(variant.price) || 0,
          stock: parseInt(variant.stock) || 0,
          image: variant.image || null,
          isActive: true
        }))
      };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id as string },
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
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;

    const existingProduct = await prisma.product.findFirst({
      where: { id: id as string, mandalId }
    });
    if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found or access denied" });

    await prisma.product.delete({ where: { id: id as string } });

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createBulkProducts = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "Payload must be a non-empty 'products' array." });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
        const data = products[i];
        try {
            if (!data.name_en && !data.name) throw new Error("Name is required");
            if (!data.category) throw new Error("Category is required");

            const tryParse = (val: any) => {
                if (typeof val !== 'string') return val;
                if (!val || (!val.trim().startsWith('[') && !val.trim().startsWith('{'))) return val;
                try { return JSON.parse(val); } catch (e) { return val; }
            };

            await prisma.product.create({
              data: {
                name: buildLangJson(data.name_en || data.name, data.name_hi, data.name_mr),
                description: buildLangJson(data.description_en || data.description, data.description_hi, data.description_mr),
                category: buildLangJson(data.category_en || data.category, data.category_hi, data.category_mr),
                highlights: buildLangJson(
                    tryParse(data.highlights_en),
                    tryParse(data.highlights_hi),
                    tryParse(data.highlights_mr)
                ),
                longDescription: buildLangJson(data.longDescription_en, data.longDescription_hi, data.longDescription_mr),
                shippingInfo: buildLangJson(data.shippingInfo_en, data.shippingInfo_hi, data.shippingInfo_mr),
                origin: buildLangJson(data.origin_en, data.origin_hi, data.origin_mr),
                categoryId: data.category,
                mandalId: mandalId,
                status: "pending",
                image: null,
                variants: {
                  create: Array.isArray(data.variants) ? data.variants.map((v: any) => ({
                    name: buildLangJson(v.name_en || v.name || "Standard", v.name_hi, v.name_mr),
                    price: parseFloat(v.price) || 0,
                    stock: parseInt(v.stock) || 0,
                    image: null
                  })) : []
                }
              }
            });
            successCount++;
        } catch (err: any) {
            failCount++;
            errors.push(`Row ${i + 2}: ${err.message}`);
        }
    }

    res.status(201).json({
        success: true,
        data: { successCount, failCount, errors }
    });

  } catch (error: any) {
    console.error("Create Bulk Products Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

