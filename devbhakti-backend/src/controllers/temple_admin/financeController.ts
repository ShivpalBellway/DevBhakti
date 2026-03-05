import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { isPayoutAllowed, nextPayoutDate } from "../../utils/payoutSchedule";

const prisma = new PrismaClient();

// Get Ledger Entries for a Temple
export const getTempleLedger = async (req: Request, res: Response) => {
  try {
    const { templeId } = req.params;

    const entries = await prisma.templeLedger.findMany({
      where: { templeId: templeId as string },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ success: true, data: entries });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Financial Summary for Temple Dashboard
export const getTempleFinanceSummary = async (req: Request, res: Response) => {
  try {
    const { templeId } = req.params;

    // Fetch data in parallel
    const [ledger, withdrawals] = await Promise.all([
      prisma.templeLedger.findMany({ where: { templeId: templeId as string } }),
      prisma.withdrawalRequest.findMany({
        where: { templeId: templeId as string, status: { in: ["PENDING", "APPROVED", "PAID"] } }
      })
    ]);

    const now = new Date();
    // 3 Days escrow window
    const escrowThreshold = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

    // --- 1. Income Analysis ---
    // Filter valid income (exclude withdrawals and cancelled txns)
    const validIncomeEntries = ledger.filter((e: any) =>
      e.type !== "WITHDRAWAL" && e.status !== "CANCELLED"
    );

    const totalEarnings = validIncomeEntries.reduce((sum: number, e: any) => sum + (e.grossAmount || 0), 0);
    const totalCommission = validIncomeEntries.reduce((sum: number, e: any) => sum + (e.commission || 0), 0);
    const netEarnings = totalEarnings - totalCommission;

    // --- 2. Settlement Analysis ---
    // Completed earnings Only
    const completedIncomeEntries = validIncomeEntries.filter((e: any) => e.status === "COMPLETED");

    // Settled: Completed AND older than 3 days
    const settledIncome = completedIncomeEntries
      .filter((e: any) => new Date(e.createdAt) <= escrowThreshold)
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // In Escrow: Completed BUT newer than 3 days
    // Note: We use e.amount (net amount) for balance calculations, not gross.
    const inEscrow = completedIncomeEntries
      .filter((e: any) => new Date(e.createdAt) > escrowThreshold)
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // Pending Fulfillment: Not even completed yet
    const pendingFulfillment = validIncomeEntries
      .filter((e: any) => e.status === "PENDING")
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // --- 3. Payout Analysis ---
    // Paid Withdrawals (Money already left the system)
    const totalPaidPayouts = withdrawals
      .filter((w: any) => w.status === "PAID")
      .reduce((sum: number, w: any) => sum + w.amount, 0);

    // Locked/Processing (Money requested but not yet paid - effectively blocked)
    const processingWithdrawals = withdrawals
      .filter((w: any) => w.status === "PENDING" || w.status === "APPROVED")
      .reduce((sum: number, w: any) => sum + w.amount, 0);

    // --- 4. Final Balance ---
    // Available = (Settled Income) - (All Payouts: Paid + Locked)
    // Payout Schedule Restricted: If not 15th or 28th, "Available" for withdrawal is 0
    let finalAvailable = settledIncome - totalPaidPayouts - processingWithdrawals;
    if (!isPayoutAllowed(now)) {
      finalAvailable = 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings, // Gross Sales
        totalCommission,
        netEarnings,
        availableBalance: Math.max(0, finalAvailable),
        pendingBalance: pendingFulfillment, // Future revenue
        inEscrow, // Trapped in 3-day hold
        processingWithdrawals // Currently requested
      }
    });

  } catch (error: any) {
    console.error("Finance Summary Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load financial summary" });
  }
};

// Request Withdrawal with Transaction Safety
export const requestWithdrawal = async (req: Request, res: Response) => {
  try {
    const { templeId, amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Use a transaction to prevent race conditions during balance check
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // ---- NEW SCHEDULE CHECK ----
      if (!isPayoutAllowed(now)) {
        const next = nextPayoutDate(now);
        throw new Error(`Payouts are only allowed on the 15th and 28th. Next payout date: ${next.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
      }

      const escrowThreshold = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

      // Fetch ledgers
      const ledger = await tx.templeLedger.findMany({
        where: {
          templeId,
          status: "COMPLETED",
          type: { not: "WITHDRAWAL" },
          createdAt: { lte: escrowThreshold }
        }
      });

      // Sum settled income
      const settledIncome = ledger.reduce((sum: number, e: any) => sum + e.amount, 0);

      // Fetch withdrawals (Locked + Paid)
      const withdrawals = await tx.withdrawalRequest.findMany({
        where: { templeId, status: { in: ["PENDING", "APPROVED", "PAID"] } }
      });

      const totalDebits = withdrawals.reduce((sum: number, w: any) => sum + w.amount, 0);
      const netAvailable = settledIncome - totalDebits;

      // 2. Check sufficiency
      if (amount > netAvailable) {
        throw new Error(`Insufficient settled balance. Available: ₹${netAvailable}`);
      }

      // 3. Create Request
      await tx.withdrawalRequest.create({
        data: {
          templeId,
          amount,
          bankDetails,
          status: "PENDING"
        }
      });
    });

    return res.status(201).json({ success: true, message: "Withdrawal request submitted successfully" });

  } catch (error: any) {
    console.error("Withdrawal Request Error:", error);
    // Return 400 for business logic errors (like insufficient funds), 500 for others
    const statusCode = error.message.includes("Insufficient") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};
