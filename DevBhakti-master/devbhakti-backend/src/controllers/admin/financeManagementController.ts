import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { getLang, localize, getEnglish } from "../../utils/localization";
import ExcelJS from 'exceljs';

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

    const lang = getLang(req);
    return res.status(200).json({ success: true, data: localize(requests, lang) });
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

    const lang = getLang(req);
    return res.status(200).json({ success: true, message: `Withdrawal request ${status}`, data: localize(updated, lang) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Platform Financial Stats for Admin
// financeController.ts - getPlatformFinanceSummary mein change karo

export const getPlatformFinanceSummary = async (req: Request, res: Response) => {
  try {
    // Temple & Mandal Ledger for Pooja, Product, and Donation earnings (only COMPLETED)
    const [templeLedger, mandalLedger] = await Promise.all([
      prisma.templeLedger.findMany({
        where: { 
          status: "COMPLETED",
          type: { in: ["POOJA_EARNING", "MARKETPLACE_EARNING", "DONATION_EARNING"] }
        }
      }),
      prisma.mandalLedger.findMany({
        where: { 
          status: "COMPLETED",
          type: { in: ["POOJA_EARNING", "MARKETPLACE_EARNING", "DONATION_EARNING"] }
        }
      })
    ]);

    const combinedLedger = [...templeLedger, ...mandalLedger];

    const totalPlatformGross = combinedLedger.reduce((sum, e) => sum + (Number(e.grossAmount) || 0), 0);
    const totalPlatformCommission = combinedLedger.reduce((sum, e) => sum + (Number(e.commission) || 0), 0);

    // Breakdown
    const totalPoojaBookings = combinedLedger
      .filter(e => e.type === "POOJA_EARNING")
      .reduce((sum, e) => sum + (Number(e.grossAmount) || 0), 0);

    const totalProductSales = combinedLedger
      .filter(e => e.type === "MARKETPLACE_EARNING")
      .reduce((sum, e) => sum + (Number(e.grossAmount) || 0), 0);

    const totalDonations = combinedLedger
      .filter(e => e.type === "DONATION_EARNING")
      .reduce((sum, e) => sum + (Number(e.grossAmount) || 0), 0);

    const [pendingTempleRequests, pendingMandalRequests, totalTemplePayouts, totalMandalPayouts] = await Promise.all([
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.mandalWithdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.withdrawalRequest.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.mandalWithdrawalRequest.aggregate({ where: { status: "PAID" }, _sum: { amount: true } })
    ]);

    const totalPaidOut = (totalTemplePayouts._sum.amount || 0) + (totalMandalPayouts._sum.amount || 0);

    return res.status(200).json({
      success: true,
      data: {
        totalPlatformGross,              // Devotee total paid
        totalPlatformCommission,         // Platform earns
        activePayouts: pendingTempleRequests + pendingMandalRequests,
        totalPaidOut,
        totalPoojaBookings,
        totalProductSales,
        totalDonations                   // Merchant gets
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
    const { page = 1, limit = 10, templeId, sellerId, mandalId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const lang = getLang(req);

    // If specific filter is applied
    if (mandalId) {
      const where: any = { status: "COMPLETED", mandalId: String(mandalId) };
      const [transactions, total] = await Promise.all([
        prisma.mandalLedger.findMany({
          where,
          include: {
            mandal: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit)
        }),
        prisma.mandalLedger.count({ where })
      ]);
      return res.status(200).json({
        success: true,
        data: localize(transactions, lang),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    }

    if (templeId || sellerId) {
      const where: any = { status: "COMPLETED" };
      if (templeId) where.templeId = String(templeId);
      if (sellerId) where.sellerId = String(sellerId);

      const [transactions, total] = await Promise.all([
        prisma.templeLedger.findMany({
          where,
          include: {
            temple: { select: { name: true } },
            seller: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit)
        }),
        prisma.templeLedger.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: localize(transactions, lang),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    }

    // Overall Admin View - Combine Temple & Mandal Ledgers
    const [templeTxs, mandalTxs] = await Promise.all([
      prisma.templeLedger.findMany({
        where: { status: "COMPLETED" },
        include: {
          temple: { select: { name: true } },
          seller: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 500
      }),
      prisma.mandalLedger.findMany({
        where: { status: "COMPLETED" },
        include: {
          mandal: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 500
      })
    ]);

    const combined = [...templeTxs, ...mandalTxs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = combined.length;
    const paginated = combined.slice(skip, skip + Number(limit));

    return res.status(200).json({
      success: true,
      data: localize(paginated, lang),
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
    const { templeId, sellerId, mandalId } = req.query;

    let transactions: any[] = [];

    if (mandalId) {
      transactions = await prisma.mandalLedger.findMany({
        where: { status: "COMPLETED", mandalId: String(mandalId) },
        include: { mandal: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      });
    } else if (templeId || sellerId) {
      const where: any = { status: "COMPLETED" };
      if (templeId) where.templeId = String(templeId);
      if (sellerId) where.sellerId = String(sellerId);
      transactions = await prisma.templeLedger.findMany({
        where,
        include: {
          temple: { select: { name: true } },
          seller: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      const [tTxs, mTxs] = await Promise.all([
        prisma.templeLedger.findMany({
          where: { status: "COMPLETED" },
          include: { temple: { select: { name: true } }, seller: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        }),
        prisma.mandalLedger.findMany({
          where: { status: "COMPLETED" },
          include: { mandal: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        })
      ]);
      transactions = [...tTxs, ...mTxs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions Report');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Merchant', key: 'merchant', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Razorpay Order ID', key: 'razorpayOrderId', width: 30 },
      { header: 'Razorpay Payment ID', key: 'razorpayPaymentId', width: 30 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
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
      const merchantName = tx.mandal ? getEnglish(tx.mandal.name) : tx.temple ? getEnglish(tx.temple.name) : (tx.seller?.name || 'DevBhakti');
      worksheet.addRow({
        id: tx.id,
        date: tx.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        merchant: merchantName,
        description: tx.description,
        type: tx.type,
        status: tx.status,
        razorpayOrderId: tx.razorpayOrderId || '',
        razorpayPaymentId: tx.razorpayPaymentId || '',
        paymentMethod: tx.paymentMethod || '',
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
