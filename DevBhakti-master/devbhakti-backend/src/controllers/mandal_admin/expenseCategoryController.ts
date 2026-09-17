import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Decoration", description: "Flowers, stage setup, and hall decoration" },
  { name: "Sound & DJ", description: "Audio systems, microphone, and speakers" },
  { name: "Lighting & Electricals", description: "Decor lights, generators, and electric bills" },
  { name: "Prasad & Annadanam", description: "Ingredients, cooking, and food distribution" },
  { name: "Transport & Vehicle", description: "Idol transport, vehicle rental, and fuel" },
  { name: "Infrastructure & Tent", description: "Mandap, chairs, carpet, and security barricades" },
  { name: "Materials & Puja Supplies", description: "Puja samagri, havan items, and flowers" },
  { name: "Marketing & Publicity", description: "Banners, posters, digital promotion, and passes" },
  { name: "Security & Manpower", description: "Guard charges, housekeeping, and volunteers" },
  { name: "Others", description: "Miscellaneous expenses" },
];

// Helper to seed default categories if none exist for mandal
export const ensureDefaultMandalCategories = async (mandalId: string) => {
  const count = await prisma.expenseCategory.count({ where: { mandalId } });
  if (count === 0) {
    await prisma.expenseCategory.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({
        name: cat.name,
        description: cat.description,
        mandalId,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }
};

// Get All Expense Categories for a Mandal
export const getMandalExpenseCategories = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const search = req.query.search as string;

    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    await ensureDefaultMandalCategories(mandalId);

    const whereClause: any = { mandalId, isActive: true };
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const categories = await prisma.expenseCategory.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate total amount spent per category
    const expenseSums = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: { mandalId },
      _sum: { amount: true },
    });

    const sumMap = new Map(expenseSums.map(s => [s.categoryId, s._sum.amount || 0]));

    const result = categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      expenseCount: c._count.expenses,
      totalSpent: sumMap.get(c.id) || 0,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Get Mandal Expense Categories Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Custom Expense Category
export const createMandalExpenseCategory = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const { name, description } = req.body;

    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const cleanName = name.trim();

    // Check duplicate
    const existing = await prisma.expenseCategory.findUnique({
      where: {
        name_mandalId: {
          name: cleanName,
          mandalId,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ success: false, message: "Category with this name already exists" });
      }
      // Re-activate if was soft deleted
      const reactivated = await prisma.expenseCategory.update({
        where: { id: existing.id },
        data: { isActive: true, description: description?.trim() || existing.description },
      });
      return res.status(200).json({ success: true, message: "Category reactivated", data: reactivated });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: cleanName,
        description: description?.trim() || null,
        mandalId,
        isActive: true,
      },
    });

    return res.status(201).json({ success: true, message: "Category created successfully", data: category });
  } catch (error: any) {
    console.error("Create Mandal Expense Category Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Category
export const updateMandalExpenseCategory = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const id = req.params.id as string;
    const { name, description } = req.body;

    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    const category = await prisma.expenseCategory.findFirst({
      where: { id, mandalId },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name ? name.trim() : category.name,
        description: description !== undefined ? description?.trim() : category.description,
      },
    });

    // Also update categoryName in linked expenses for cached search
    if (name && name.trim() !== category.name) {
      await prisma.expense.updateMany({
        where: { categoryId: id },
        data: { categoryName: name.trim() },
      });
    }

    return res.status(200).json({ success: true, message: "Category updated successfully", data: updated });
  } catch (error: any) {
    console.error("Update Mandal Expense Category Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete / Deactivate Category
export const deleteMandalExpenseCategory = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const id = req.params.id as string;

    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    const category = await prisma.expenseCategory.findFirst({
      where: { id, mandalId },
      include: { _count: { select: { expenses: true } } },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Soft-delete category to preserve historical expense reports
    await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Delete Mandal Expense Category Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
