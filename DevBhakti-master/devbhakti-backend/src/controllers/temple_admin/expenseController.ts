import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add Temple Expense Entry
export const createTempleExpense = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const user = (req as any).owner;

    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    const {
      amount,
      categoryId,
      description,
      expenseDate,
      paymentMode = "CASH",
      paidByMemberId,
      paidByName,
      receiptImage,
      notes,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Expense amount must be greater than zero" });
    }

    if (!categoryId) {
      return res.status(400).json({ success: false, message: "Expense category is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: "Description / Purpose is required" });
    }

    if (!paidByName || !paidByName.trim()) {
      return res.status(400).json({ success: false, message: "Paid By / Spent By name is required" });
    }

    const category = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, templeId },
    });

    if (!category) {
      return res.status(400).json({ success: false, message: "Invalid category selected" });
    }

    const enteredByUserId = user?.userId || user?.staffId || "SYSTEM";
    const enteredByName = user?.name || user?.email || "Temple Admin";

    const dateVal = expenseDate ? new Date(expenseDate) : new Date();

    const expense = await prisma.expense.create({
      data: {
        entityType: "TEMPLE",
        templeId,
        amount: Number(amount),
        categoryId,
        categoryName: category.name,
        description: description.trim(),
        expenseDate: dateVal,
        paymentMode: paymentMode?.toUpperCase() || "CASH",
        paidByMemberId: paidByMemberId || null,
        paidByName: paidByName.trim(),
        enteredByUserId,
        enteredByName,
        receiptImage: receiptImage || null,
        notes: notes?.trim() || null,
        auditLogs: {
          create: {
            action: "CREATED",
            performedBy: enteredByUserId,
            performedByName: enteredByName,
            changes: { amount, categoryName: category.name, paidByName },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Temple expense recorded successfully",
      data: expense,
    });
  } catch (error: any) {
    console.error("Create Temple Expense Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Temple Expenses List
export const getTempleExpenses = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    const {
      search,
      categoryId,
      paymentMode,
      paidByName,
      startDate,
      endDate,
      page = "1",
      limit = "50",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit)) || 50));

    const where: any = { templeId };

    if (categoryId && String(categoryId) !== "ALL") {
      where.categoryId = String(categoryId);
    }

    if (paymentMode && String(paymentMode) !== "ALL") {
      where.paymentMode = String(paymentMode).toUpperCase();
    }

    if (paidByName && String(paidByName).trim() !== "") {
      where.paidByName = { contains: String(paidByName).trim(), mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    if (search && String(search).trim() !== "") {
      const s = String(search).trim();
      where.OR = [
        { description: { contains: s, mode: "insensitive" } },
        { paidByName: { contains: s, mode: "insensitive" } },
        { categoryName: { contains: s, mode: "insensitive" } },
        { notes: { contains: s, mode: "insensitive" } },
      ];
    }

    const [total, list] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy: { expenseDate: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        expenses: list,
      },
    });
  } catch (error: any) {
    console.error("Get Temple Expenses Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Temple Expense Stats & Analytics
export const getTempleExpenseStats = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    const { startDate, endDate } = req.query;

    const where: any = { templeId };
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const [allExpenses, categoryGroup, memberGroup, ledger, withdrawals] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expenseDate: "desc" } }),
      prisma.expense.groupBy({
        by: ["categoryId", "categoryName"],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["paidByName"],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.templeLedger.findMany({ where: { templeId } }),
      prisma.withdrawalRequest.findMany({ where: { templeId, status: { in: ["PENDING", "APPROVED", "PAID"] } } }),
    ]);

    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalGrossEarnings = ledger
      .filter(l => l.type !== "WITHDRAWAL")
      .reduce((sum, l) => sum + (l.grossAmount || l.amount || 0), 0);

    const totalWithdrawn = withdrawals
      .filter(w => w.status === "PAID")
      .reduce((sum, w) => sum + w.amount, 0);

    const netOperationalBalance = totalGrossEarnings - totalExpenses - totalWithdrawn;

    const categoryBreakdown = categoryGroup.map(cg => ({
      categoryId: cg.categoryId,
      categoryName: cg.categoryName,
      totalAmount: cg._sum.amount || 0,
      count: cg._count.id,
      percentage: totalExpenses > 0 ? Number((((cg._sum.amount || 0) / totalExpenses) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    const memberBreakdown = memberGroup.map(mg => ({
      paidByName: mg.paidByName,
      totalAmount: mg._sum.amount || 0,
      count: mg._count.id,
      percentage: totalExpenses > 0 ? Number((((mg._sum.amount || 0) / totalExpenses) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    return res.status(200).json({
      success: true,
      data: {
        totalExpenses,
        totalGrossEarnings,
        totalWithdrawn,
        netOperationalBalance,
        totalRecords: allExpenses.length,
        categoryBreakdown,
        memberBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Get Temple Expense Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Temple Expense Entry
export const updateTempleExpense = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const user = (req as any).owner;
    const id = req.params.id as string;

    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    const existing = await prisma.expense.findFirst({
      where: { id, templeId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Expense record not found" });
    }

    const {
      amount,
      categoryId,
      description,
      expenseDate,
      paymentMode,
      paidByMemberId,
      paidByName,
      receiptImage,
      notes,
    } = req.body;

    let categoryName = existing.categoryName;
    if (categoryId && categoryId !== existing.categoryId) {
      const cat = await prisma.expenseCategory.findFirst({ where: { id: categoryId, templeId } });
      if (cat) categoryName = cat.name;
    }

    const updatedBy = user?.userId || user?.staffId || "SYSTEM";
    const updatedByName = user?.name || user?.email || "Temple Admin";

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount: amount !== undefined ? Number(amount) : existing.amount,
        categoryId: categoryId || existing.categoryId,
        categoryName,
        description: description ? description.trim() : existing.description,
        expenseDate: expenseDate ? new Date(expenseDate) : existing.expenseDate,
        paymentMode: paymentMode ? paymentMode.toUpperCase() : existing.paymentMode,
        paidByMemberId: paidByMemberId !== undefined ? paidByMemberId : existing.paidByMemberId,
        paidByName: paidByName ? paidByName.trim() : existing.paidByName,
        receiptImage: receiptImage !== undefined ? receiptImage : existing.receiptImage,
        notes: notes !== undefined ? notes?.trim() : existing.notes,
        auditLogs: {
          create: {
            action: "UPDATED",
            performedBy: updatedBy,
            performedByName: updatedByName,
            changes: { oldAmount: existing.amount, newAmount: amount, oldCategory: existing.categoryName, newCategory: categoryName },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Temple expense updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update Temple Expense Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Temple Expense Entry
export const deleteTempleExpense = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const id = req.params.id as string;

    if (!templeId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Temple ID missing" });
    }

    const existing = await prisma.expense.findFirst({
      where: { id, templeId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Expense record not found" });
    }

    await prisma.expense.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("Delete Temple Expense Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Upload Expense Bill / Receipt File (Image or PDF)
export const uploadReceipt = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No bill/receipt file uploaded" });
    }
    const fileUrl = `/uploads/expenses/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      url: fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error: any) {
    console.error("Upload Expense Receipt Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

