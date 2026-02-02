import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
      where: { type: { not: "WITHDRAWAL" }, status: "COMPLETED" }
    });

    const totalRevenue = ledger.reduce((sum: number, e: any) => sum + (Number(e.grossAmount) || 0), 0);
    const totalCommission = ledger.reduce((sum: number, e: any) => sum + (Number(e.commission) || 0), 0);
    
    console.log(`Calculated Summary: Revenue=${totalRevenue}, Commission=${totalCommission}`);
    
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
        totalPaidOut: totalPayouts._sum.amount || 0
      }
    });
  } catch (error: any) {
    console.error("Error in getPlatformFinanceSummary:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// Get all ledger entries for platform-wide monitoring
export const getAllPlatformTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.templeLedger.findMany({
      include: {
        temple: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ success: true, data: transactions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
