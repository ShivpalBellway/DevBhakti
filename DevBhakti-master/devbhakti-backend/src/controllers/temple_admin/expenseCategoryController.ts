import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TEMPLE_CATEGORIES = [
  { name: "Poojas & Havans", description: "Samagri, purohit dakshina, and ritual items" },
  { name: "Flowers & Garlands", description: "Daily deity flower decoration and garlands" },
  { name: "Prasad & Annadanam", description: "Bhog preparation, ingredients, and free meal distribution" },
  { name: "Temple Maintenance", description: "Sanitation, plumbing, painting, and repairs" },
  { name: "Electricity & Utilities", description: "Power bills, water charges, and generator fuel" },
  { name: "Staff & Archaka Allowance", description: "Pujari stipends, security, and cleaning staff charges" },
  { name: "Festival & Event Setup", description: "Special alankaram, tent, stage, and sound" },
  { name: "Office & Printing", description: "Receipt books, stationery, and IT maintenance" },
  { name: "Others", description: "Miscellaneous expenses" },
];

export const ensureDefaultTempleCategories = async (templeId: string) => {
  const count = await prisma.expenseCategory.count({ where: { templeId } });
  if (count === 0) {
    await prisma.expenseCategory.createMany({
      data: DEFAULT_TEMPLE_CATEGORIES.map(cat => ({
        name: cat.name,
        description: cat.description,
        templeId,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }
};

// Get All Expense Categories for a Temple
export const getTempleExpenseCategories = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const search = req.query.search as string;

    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    await ensureDefaultTempleCategories(templeId);

    const whereClause: any = { templeId, isActive: true };
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

    const expenseSums = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: { templeId },
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
    console.error("Get Temple Expense Categories Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Custom Expense Category for Temple
export const createTempleExpenseCategory = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const { name, description } = req.body;

    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const cleanName = name.trim();

    const existing = await prisma.expenseCategory.findUnique({
      where: {
        name_templeId: {
          name: cleanName,
          templeId,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ success: false, message: "Category with this name already exists" });
      }
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
        templeId,
        isActive: true,
      },
    });

    return res.status(201).json({ success: true, message: "Category created successfully", data: category });
  } catch (error: any) {
    console.error("Create Temple Expense Category Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Temple Category
export const updateTempleExpenseCategory = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const id = req.params.id as string;
    const { name, description } = req.body;

    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    const category = await prisma.expenseCategory.findFirst({
      where: { id, templeId },
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

    if (name && name.trim() !== category.name) {
      await prisma.expense.updateMany({
        where: { categoryId: id },
        data: { categoryName: name.trim() },
      });
    }

    return res.status(200).json({ success: true, message: "Category updated successfully", data: updated });
  } catch (error: any) {
    console.error("Update Temple Expense Category Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Temple Category
export const deleteTempleExpenseCategory = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const id = req.params.id as string;

    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    const category = await prisma.expenseCategory.findFirst({
      where: { id, templeId },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Delete Temple Expense Category Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
