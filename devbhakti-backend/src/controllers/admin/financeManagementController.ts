import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

// Get all withdrawal requests for admin
export const getAllWithdrawalRequests = async (req: Request, res: Response) => {
  console.log("Fetching all withdrawal requests...");
  try {
    const requests = await prisma.withdrawalRequest.findMany({
      include: {
        temple: {
          select: {
            name: true,
            location: true,
            user: { select: { name: true, phone: true } }
          }
        },
        seller: {
          select: {
            name: true,
            location: true,
            user: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    console.error("Error in getAllWithdrawalRequests:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin updates withdrawal status (Approve/Reject/Paid)
export const updateWithdrawalStatus = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes, transactionId } = req.body;
    const receiptImage = (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined;

    const request = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId as string }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const updated = await prisma.withdrawalRequest.update({
      where: { id: requestId as string },
      data: {
        status,
        adminNotes,
        transactionId,
        receiptImage: receiptImage || undefined,
        updatedAt: new Date()
      }
    });

    // If status is PAID, create a Ledger entry with negative amount
    if (status === "PAID") {
      // Check if already has a completed withdrawal ledger entry to avoid double entry
      const existingLedger = await prisma.templeLedger.findFirst({
        where: { sourceId: requestId as string, type: "WITHDRAWAL" }
      });

      if (!existingLedger) {
        await prisma.templeLedger.create({
          data: {
            templeId: request.templeId,
            amount: -request.amount, // Negative for withdrawal
            type: "WITHDRAWAL",
            sourceId: requestId as string,
            description: `Payout processed (ID: ${(requestId as string).slice(-6).toUpperCase()})`,
            status: "COMPLETED"
          }
        });
      }
    }

    return res.status(200).json({ success: true, message: `Withdrawal request ${status}`, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Platform Financial Stats for Admin
export const getPlatformFinanceSummary = async (req: Request, res: Response) => {
  console.log("Fetching platform finance summary...");
  try {
    const ledger = await prisma.templeLedger.findMany({
      where: {
        status: { not: "CANCELLED" }
      }
    });

    const earnings = ledger.filter(e => e.type !== "WITHDRAWAL");

    const totalRevenue = earnings.reduce((sum: number, e: any) => sum + (Number(e.grossAmount) || 0), 0);
    const totalCommission = earnings.reduce((sum: number, e: any) => sum + (Number(e.commission) || 0), 0);

    const totalPoojaBookings = earnings
      .filter(e => e.type === "POOJA_EARNING")
      .reduce((sum: number, e: any) => sum + (Number(e.grossAmount) || 0), 0);

    const totalProductSales = earnings
      .filter(e => e.type === "MARKETPLACE_EARNING")
      .reduce((sum: number, e: any) => sum + (Number(e.grossAmount) || 0), 0);

    const totalDonations = earnings
      .filter(e => e.type === "DONATION_EARNING")
      .reduce((sum: number, e: any) => sum + (Number(e.grossAmount) || 0), 0);

    console.log(`Calculated Summary: Volume=${totalRevenue}, Commission=${totalCommission}`);

    const pendingRequests = await prisma.withdrawalRequest.count({
      where: { status: "PENDING" }
    });

    const totalPayouts = await prisma.withdrawalRequest.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalPlatformGross: totalRevenue,
        totalPlatformCommission: totalCommission,
        activePayouts: pendingRequests,
        totalPaidOut: totalPayouts._sum.amount || 0,
        totalPoojaBookings,
        totalProductSales,
        totalDonations
      }
    });
  } catch (error: any) {
    console.error("Error in getPlatformFinanceSummary:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// Get all ledger entries for platform-wide monitoring with pagination and filtering
export const getAllPlatformTransactions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, templeId, sellerId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (templeId) where.templeId = String(templeId);
    if (sellerId) where.sellerId = String(sellerId);

    const [transactions, total] = await Promise.all([
      prisma.templeLedger.findMany({
        where,
        include: {
          temple: {
            select: {
              name: true,
            }
          },
          seller: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit)
      }),
      prisma.templeLedger.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error("Error in getAllPlatformTransactions:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadTransactionsExcel = async (req: Request, res: Response) => {
  try {
    const { templeId, sellerId } = req.query;
    const where: any = {};
    if (templeId) where.templeId = String(templeId);
    if (sellerId) where.sellerId = String(sellerId);

    const transactions = await prisma.templeLedger.findMany({
      where,
      include: {
        temple: { select: { name: true } },
        seller: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions Report');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Merchant', key: 'merchant', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Gross Amount', key: 'grossAmount', width: 15 },
      { header: 'Commission', key: 'commission', width: 15 },
      { header: 'Net Amount', key: 'amount', width: 15 },
    ];

    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) {
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E293B' }, // Slate-800
        };
      }
      row.alignment = { vertical: 'middle', wrapText: true };
    });

    transactions.forEach((tx: any) => {
      worksheet.addRow({
        id: tx.id,
        date: tx.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        merchant: tx.temple?.name || tx.seller?.name || 'Platform',
        description: tx.description,
        type: tx.type,
        status: tx.status,
        grossAmount: tx.grossAmount || 0,
        commission: tx.commission || 0,
        amount: tx.amount || 0,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    return res.status(200).send(buffer);

  } catch (error: any) {
    console.error("Excel Export Error:", error);
    return res.status(500).json({ success: false, message: "Failed to export Excel" });
  }
};
