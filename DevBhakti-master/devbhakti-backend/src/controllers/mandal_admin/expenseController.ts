import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add Expense Entry
export const createMandalExpense = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const user = (req as any).owner; // user token info

    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    let receiptImageUrl = req.body.receiptImage || null;
    if (req.file) {
      const protocol = req.protocol || "http";
      const host = req.get("host") || "localhost:5000";
      receiptImageUrl = `${protocol}://${host}/uploads/expenses/${req.file.filename}`;
    }

    const {
      amount,
      categoryId,
      description,
      expenseDate,
      paymentMode = "CASH",
      paidByMemberId,
      paidByName,
      notes,
    } = req.body;

    const numAmount = Number(amount);
    // Validations
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Expense amount must be greater than zero" });
    }

    if (!categoryId) {
      return res.status(400).json({ success: false, message: "Expense category is required" });
    }

    // Verify category belongs to mandal
    const category = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, mandalId },
    });

    if (!category) {
      return res.status(400).json({ success: false, message: "Invalid category selected" });
    }
    let resolvedPaidByName = paidByName?.trim() || null;
    if (paidByMemberId && !resolvedPaidByName) {
      const staffMember = await prisma.staffMember.findFirst({
        where: { id: paidByMemberId, ownerId: mandalId, ownerType: "MANDAL" },
      });
      if (staffMember) {
        resolvedPaidByName = staffMember.name;
      }
    }
    if (!resolvedPaidByName) {
      resolvedPaidByName = "Mandal Admin";
    }

    const enteredByUserId = user?.userId || user?.staffId || "SYSTEM";
    const enteredByName = user?.name || user?.email || "Mandal Admin";

    const dateVal = expenseDate ? new Date(expenseDate) : new Date();

    const expense = await prisma.expense.create({
      data: {
        entityType: "MANDAL",
        mandalId,
        amount: numAmount,
        categoryId,
        categoryName: category.name,
        description: description?.trim() || "N/A",
        expenseDate: dateVal,
        paymentMode: paymentMode?.toUpperCase() || "CASH",
        paidByMemberId: paidByMemberId || null,
        paidByName: resolvedPaidByName,
        enteredByUserId,
        enteredByName,
        receiptImage: receiptImageUrl,
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
      message: "Expense recorded successfully",
      data: expense,
    });
  } catch (error: any) {
    console.error("Create Mandal Expense Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Mandal Expenses List with Search & Filters
export const getMandalExpenses = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
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

    const where: any = { mandalId };

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
      if (startDate) {
        where.expenseDate.gte = new Date(String(startDate));
      }
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
    console.error("Get Mandal Expenses Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Expense Stats & Analytics (Total, Category Breakdown, Member Breakdown, Net Balance)
export const getMandalExpenseStats = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    const { startDate, endDate, categorySearch, memberSearch } = req.query;

    const where: any = { mandalId };
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const categoryWhere: any = { ...where };
    if (categorySearch) {
      categoryWhere.categoryName = { contains: String(categorySearch), mode: "insensitive" };
    }

    const memberWhere: any = { ...where };
    if (memberSearch) {
      memberWhere.paidByName = { contains: String(memberSearch), mode: "insensitive" };
    }

    const [allExpenses, categoryGroup, memberGroup, ledger, withdrawals] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expenseDate: "desc" } }),
      prisma.expense.groupBy({
        by: ["categoryId", "categoryName"],
        where: categoryWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["paidByName"],
        where: memberWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.mandalLedger.findMany({ where: { mandalId, status: { not: "CANCELLED" } } }),
      prisma.mandalWithdrawalRequest.findMany({ where: { mandalId, status: { in: ["PENDING", "APPROVED", "PAID"] } } }),
    ]);

    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate Gross Earnings from ledger
    const totalGrossEarnings = ledger
      .filter(l => l.type !== "WITHDRAWAL")
      .reduce((sum, l) => sum + (l.grossAmount || l.amount || 0), 0);

    const totalWithdrawn = withdrawals
      .filter(w => w.status === "PAID")
      .reduce((sum, w) => sum + w.amount, 0);

    const netOperationalBalance = totalGrossEarnings - totalExpenses - totalWithdrawn;

    // Category breakdown
    const categoryBreakdown = categoryGroup.map(cg => ({
      categoryId: cg.categoryId,
      categoryName: cg.categoryName,
      totalAmount: cg._sum.amount || 0,
      count: cg._count.id,
      percentage: totalExpenses > 0 ? Number((((cg._sum.amount || 0) / totalExpenses) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    // Member breakdown
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
    console.error("Get Mandal Expense Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Expense Entry
export const updateMandalExpense = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const user = (req as any).owner;
    const id = req.params.id as string;

    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    const existing = await prisma.expense.findFirst({
      where: { id, mandalId },
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
      const cat = await prisma.expenseCategory.findFirst({ where: { id: categoryId, mandalId } });
      if (cat) categoryName = cat.name;
    }

    const updatedBy = user?.userId || user?.staffId || "SYSTEM";
    const updatedByName = user?.name || user?.email || "Mandal Admin";

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
      message: "Expense updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update Mandal Expense Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Expense Entry
export const deleteMandalExpense = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const id = req.params.id as string;

    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    const existing = await prisma.expense.findFirst({
      where: { id, mandalId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Expense record not found" });
    }

    await prisma.expense.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("Delete Mandal Expense Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Upload Expense Bill / Receipt File (Image or PDF)
export const uploadReceipt = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No bill/receipt file uploaded" });
    }
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:5000";
    const fileUrl = `${protocol}://${host}/uploads/expenses/${req.file.filename}`;
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

