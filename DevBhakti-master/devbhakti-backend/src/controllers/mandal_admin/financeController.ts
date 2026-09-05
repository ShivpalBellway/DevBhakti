import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { isPayoutAllowed, nextPayoutDate } from "../../utils/payoutSchedule";

const prisma = new PrismaClient();

// Get Ledger Entries for a Mandal
export const getMandalLedger = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;

    const entries = await prisma.mandalLedger.findMany({
      where: { mandalId },
      orderBy: { createdAt: "desc" }
    });

    let enrichedEntries = entries;
    try {
      const sourceIds = entries.filter(e => e.sourceId).map(e => e.sourceId as string);
      
      if (sourceIds.length > 0) {
        // Fetch donations in parallel
        const donations = await prisma.donation.findMany({
          where: { id: { in: sourceIds } },
          include: { user: { select: { name: true } } }
        });

        const donationMap = new Map(donations.map(d => [d.id, d]));

        enrichedEntries = entries.map(entry => {
          if (entry.sourceId) {
            if (entry.type === "DONATION_EARNING") {
              const donation = donationMap.get(entry.sourceId);
              if (donation) {
                return {
                  ...entry,
                  orderDetail: {
                    displayId: donation.id.slice(-8).toUpperCase(),
                    customerName: donation.user?.name || donation.donorName || "Anonymous",
                    paymentStatus: "PAID",
                    deliveryStatus: "COMPLETED"
                  }
                };
              }
            }
          }
          return entry;
        });
      }
    } catch (enrichErr) {
      console.error("Mandal ledger enrichment failed:", enrichErr);
    }

    return res.status(200).json({ success: true, data: enrichedEntries });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Financial Summary for Mandal Dashboard
export const getMandalFinanceSummary = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;

    // Fetch data in parallel
    const [ledger, withdrawals] = await Promise.all([
      prisma.mandalLedger.findMany({ where: { mandalId } }),
      prisma.mandalWithdrawalRequest.findMany({
        where: { mandalId, status: { in: ["PENDING", "APPROVED", "PAID"] } }
      })
    ]);

    const now = new Date();
    const escrowThreshold = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

    // Filter valid income (exclude withdrawals and cancelled txns)
    const validIncomeEntries = ledger.filter((e: any) =>
      e.type !== "WITHDRAWAL" && e.status !== "CANCELLED"
    );

    const totalEarnings = validIncomeEntries.reduce((sum: number, e: any) => sum + (e.grossAmount || 0), 0);
    const totalCommission = validIncomeEntries.reduce((sum: number, e: any) => sum + (e.commission || 0), 0);
    const netEarnings = totalEarnings - totalCommission;

    const completedIncomeEntries = validIncomeEntries.filter((e: any) => e.status === "COMPLETED");

    // Settled: Completed AND older than 3 days
    const settledIncome = completedIncomeEntries
      .filter((e: any) => new Date(e.createdAt) <= escrowThreshold)
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // In Escrow: Completed BUT newer than 3 days
    const inEscrow = completedIncomeEntries
      .filter((e: any) => new Date(e.createdAt) > escrowThreshold)
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // Pending Fulfillment: Not even completed yet
    const pendingFulfillment = validIncomeEntries
      .filter((e: any) => e.status === "PENDING")
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // Paid Withdrawals
    const totalPaidPayouts = withdrawals
      .filter((w: any) => w.status === "PAID")
      .reduce((sum: number, w: any) => sum + w.amount, 0);

    // Locked/Processing
    const processingWithdrawals = withdrawals
      .filter((w: any) => w.status === "PENDING" || w.status === "APPROVED")
      .reduce((sum: number, w: any) => sum + w.amount, 0);

    // Available balance
    let finalAvailable = settledIncome - totalPaidPayouts - processingWithdrawals;
    if (!isPayoutAllowed(now)) {
      finalAvailable = 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        totalCommission,
        netEarnings,
        availableBalance: Math.max(0, finalAvailable),
        pendingBalance: pendingFulfillment,
        inEscrow,
        processingWithdrawals
      }
    });

  } catch (error: any) {
    console.error("Mandal Finance Summary Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load financial summary" });
  }
};

// Request Withdrawal
export const requestMandalWithdrawal = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();

      if (!isPayoutAllowed(now)) {
        const next = nextPayoutDate(now);
        throw new Error(`Payouts are only allowed on the 15th and 28th. Next payout date: ${next.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
      }

      const escrowThreshold = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

      const ledger = await tx.mandalLedger.findMany({
        where: {
          mandalId,
          status: "COMPLETED",
          type: { not: "WITHDRAWAL" },
          createdAt: { lte: escrowThreshold }
        }
      });

      const settledIncome = ledger.reduce((sum: number, e: any) => sum + e.amount, 0);

      const withdrawals = await tx.mandalWithdrawalRequest.findMany({
        where: { mandalId, status: { in: ["PENDING", "APPROVED", "PAID"] } }
      });

      const totalDebits = withdrawals.reduce((sum: number, w: any) => sum + w.amount, 0);
      const netAvailable = settledIncome - totalDebits;

      if (amount > netAvailable) {
        throw new Error(`Insufficient settled balance. Available: ₹${netAvailable}`);
      }

      await tx.mandalWithdrawalRequest.create({
        data: {
          mandalId,
          amount,
          bankDetails,
          status: "PENDING"
        }
      });
    });

    try {
        const { notifyAdmins } = require("../../services/firebaseService");
        await notifyAdmins({
            title: 'New Mandal Withdrawal Request 🏛️',
            body: `A mandal has requested a withdrawal of ₹${amount}.`,
            data: {
                link: '/admin/finance',
                type: 'MANDAL_WITHDRAWAL_REQUEST'
            }
        });
    } catch (notifyErr) {
        console.error("Failed to notify admins for withdrawal:", notifyErr);
    }

    return res.status(201).json({ success: true, message: "Withdrawal request submitted successfully" });

  } catch (error: any) {
    console.error("Withdrawal Request Error:", error);
    const statusCode = error.message.includes("Insufficient") ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

// Get Financial Report for Mandal Dashboard (Category, Payment Mode & Online vs Offline)
export const getMandalFinancialReport = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    if (!mandalId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Mandal ID missing" });
    }

    const { period = "this_month", startDate: customStartDate, endDate: customEndDate } = req.query;

    const now = new Date();

    let rangeStart: Date;
    let rangeEnd: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (String(period).toLowerCase()) {
      case "today":
        rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case "this_week": {
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);
        break;
      }
      case "this_month":
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case "last_month":
        rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case "custom":
        if (customStartDate) {
          rangeStart = new Date(String(customStartDate));
          rangeStart.setHours(0, 0, 0, 0);
        } else {
          rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        }
        if (customEndDate) {
          rangeEnd = new Date(String(customEndDate));
          rangeEnd.setHours(23, 59, 59, 999);
        }
        break;
      default:
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const rangePoojaWhere = {
      mandalId,
      status: { in: ["BOOKED", "COMPLETED"] as any[] },
      createdAt: { gte: rangeStart, lte: rangeEnd }
    };

    const rangeDonationWhere = {
      mandalId,
      status: { in: ["SUCCESS", "PAID", "COMPLETED"] },
      createdAt: { gte: rangeStart, lte: rangeEnd }
    };

    const rangeSubOrderWhere = {
      mandalId,
      status: { notIn: ["CANCELLED", "FAILED", "PENDING"] },
      createdAt: { gte: rangeStart, lte: rangeEnd }
    };

    const rangeTellerOrderWhere = {
      mandalId,
      paymentStatus: "PAID",
      createdAt: { gte: rangeStart, lte: rangeEnd }
    };

    const rangeTicketWhere = {
      mandalId,
      status: { in: ["CONFIRMED", "USED"] as any[] },
      createdAt: { gte: rangeStart, lte: rangeEnd }
    };

    const todayPoojaWhere = { ...rangePoojaWhere, createdAt: { gte: todayStart, lte: todayEnd } };
    const todayDonationWhere = { ...rangeDonationWhere, createdAt: { gte: todayStart, lte: todayEnd } };
    const todaySubOrderWhere = { ...rangeSubOrderWhere, createdAt: { gte: todayStart, lte: todayEnd } };
    const todayTellerOrderWhere = { ...rangeTellerOrderWhere, createdAt: { gte: todayStart, lte: todayEnd } };
    const todayTicketWhere = { ...rangeTicketWhere, createdAt: { gte: todayStart, lte: todayEnd } };

    const [
      rangePoojas,
      rangeDonations,
      rangeSubOrders,
      rangeTellerOrders,
      rangeTickets,
      todayPoojas,
      todayDonations,
      todaySubOrders,
      todayTellerOrders,
      todayTickets
    ] = await Promise.all([
      prisma.poojaBooking.findMany({ where: rangePoojaWhere }),
      prisma.donation.findMany({ where: rangeDonationWhere }),
      prisma.subOrder.findMany({ where: rangeSubOrderWhere, include: { order: true } }),
      prisma.tellerOrder.findMany({ where: rangeTellerOrderWhere }),
      prisma.mandalDarshanTicket.findMany({ where: rangeTicketWhere }),
      prisma.poojaBooking.findMany({ where: todayPoojaWhere }),
      prisma.donation.findMany({ where: todayDonationWhere }),
      prisma.subOrder.findMany({ where: todaySubOrderWhere }),
      prisma.tellerOrder.findMany({ where: todayTellerOrderWhere }),
      prisma.mandalDarshanTicket.findMany({ where: todayTicketWhere })
    ]);

    const todayPoojaAmount = todayPoojas.reduce((sum, b) => sum + (b.packagePrice || 0) + (b.prasadAmount || 0), 0);
    const todayDonationAmount = todayDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const todaySacredItemsAmount = todaySubOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) + todayTellerOrders.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const todayTicketingAmount = todayTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const todayTotalCollection = todayPoojaAmount + todayDonationAmount + todaySacredItemsAmount + todayTicketingAmount;

    const poojaAmount = rangePoojas.reduce((sum, b) => sum + (b.packagePrice || 0) + (b.prasadAmount || 0), 0);
    const donationAmount = rangeDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const sacredItemsAmount = rangeSubOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) + rangeTellerOrders.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const ticketingAmount = rangeTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const totalCollection = poojaAmount + donationAmount + sacredItemsAmount + ticketingAmount;
    const totalTransactions = rangePoojas.length + rangeDonations.length + rangeSubOrders.length + rangeTellerOrders.length + rangeTickets.length;
    const avgTransactionValue = totalTransactions > 0 ? Math.round(totalCollection / totalTransactions) : 0;

    const getPercent = (amount: number) => totalCollection > 0 ? Number(((amount / totalCollection) * 100).toFixed(1)) : 0;

    let onlineCollection = 0;
    let onlineTxCount = 0;
    let offlineCollection = 0;
    let offlineTxCount = 0;

    const paymentModes: Record<string, number> = {
      UPI: 0,
      Cash: 0,
      Card: 0,
      NetBanking: 0,
      Other: 0
    };

    const normalizePaymentMode = (pm?: string | null): string => {
      if (!pm) return "Cash";
      const u = pm.toUpperCase();
      if (u.includes("UPI") || u.includes("RAZORPAY") || u.includes("PAYTM") || u.includes("PHONEPE") || u.includes("GPAY")) return "UPI";
      if (u.includes("CASH")) return "Cash";
      if (u.includes("CARD") || u.includes("DEBIT") || u.includes("CREDIT")) return "Card";
      if (u.includes("NET") || u.includes("BANK")) return "NetBanking";
      return "Other";
    };

    rangePoojas.forEach(b => {
      const amt = (b.packagePrice || 0) + (b.prasadAmount || 0);
      const isOff = b.isOffline || b.bookingSource === "MANDAL_OFFLINE" || b.bookingSource === "COUNTER" || b.bookingSource === "TELLER" || !b.razorpayOrderId;
      if (isOff) {
        offlineCollection += amt;
        offlineTxCount++;
      } else {
        onlineCollection += amt;
        onlineTxCount++;
      }
      const mode = normalizePaymentMode(b.paymentMethod || (isOff ? "Cash" : "UPI"));
      paymentModes[mode] = (paymentModes[mode] || 0) + amt;
    });

    rangeDonations.forEach(d => {
      const amt = d.amount || 0;
      const isOff = !d.razorpayOrderId || d.paymentMethod === "CASH";
      if (isOff) {
        offlineCollection += amt;
        offlineTxCount++;
      } else {
        onlineCollection += amt;
        onlineTxCount++;
      }
      const mode = normalizePaymentMode(d.paymentMethod || (isOff ? "Cash" : "UPI"));
      paymentModes[mode] = (paymentModes[mode] || 0) + amt;
    });

    rangeSubOrders.forEach(o => {
      const amt = o.totalAmount || 0;
      const isOff = !o.order?.razorpayOrderId;
      if (isOff) {
        offlineCollection += amt;
        offlineTxCount++;
      } else {
        onlineCollection += amt;
        onlineTxCount++;
      }
      const mode = normalizePaymentMode(o.order?.paymentMethod || (isOff ? "Cash" : "UPI"));
      paymentModes[mode] = (paymentModes[mode] || 0) + amt;
    });

    rangeTellerOrders.forEach(t => {
      const amt = t.totalAmount || 0;
      offlineCollection += amt;
      offlineTxCount++;
      const mode = normalizePaymentMode(t.paymentMethod || "Cash");
      paymentModes[mode] = (paymentModes[mode] || 0) + amt;
    });

    rangeTickets.forEach(t => {
      const amt = t.totalAmount || 0;
      const isOff = t.paymentMethod === "CASH" || !t.paymentMethod;
      if (isOff) {
        offlineCollection += amt;
        offlineTxCount++;
      } else {
        onlineCollection += amt;
        onlineTxCount++;
      }
      const mode = normalizePaymentMode(t.paymentMethod || (isOff ? "Cash" : "UPI"));
      paymentModes[mode] = (paymentModes[mode] || 0) + amt;
    });

    const paymentModeSummary = [
      { mode: "UPI", label: "UPI", amount: paymentModes.UPI || 0, percentage: getPercent(paymentModes.UPI || 0) },
      { mode: "CASH", label: "Cash", amount: paymentModes.Cash || 0, percentage: getPercent(paymentModes.Cash || 0) },
      { mode: "CARD", label: "Card", amount: paymentModes.Card || 0, percentage: getPercent(paymentModes.Card || 0) },
      { mode: "NETBANKING", label: "Net Banking / Other", amount: (paymentModes.NetBanking || 0) + (paymentModes.Other || 0), percentage: getPercent((paymentModes.NetBanking || 0) + (paymentModes.Other || 0)) }
    ];

    return res.status(200).json({
      success: true,
      data: {
        filterPeriod: period,
        dateRange: {
          startDate: rangeStart.toISOString(),
          endDate: rangeEnd.toISOString(),
          formattedRange: `${rangeStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${rangeEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
        },
        todaysSummary: {
          poojaAndSeva: todayPoojaAmount,
          donations: todayDonationAmount,
          sacredItems: todaySacredItemsAmount,
          ticketing: todayTicketingAmount,
          totalCollection: todayTotalCollection
        },
        overview: {
          totalCollection,
          totalTransactions,
          avgTransactionValue
        },
        categorySummary: [
          { category: "POOJA_SEVA", name: "Pooja & Seva", amount: poojaAmount, percentage: getPercent(poojaAmount) },
          { category: "DONATIONS", name: "Donations", amount: donationAmount, percentage: getPercent(donationAmount) },
          { category: "SACRED_ITEMS", name: "Sacred Items", amount: sacredItemsAmount, percentage: getPercent(sacredItemsAmount) },
          { category: "TICKETING", name: "Ticketing", amount: ticketingAmount, percentage: getPercent(ticketingAmount) }
        ],
        paymentModeSummary,
        channelSummary: {
          online: {
            amount: onlineCollection,
            count: onlineTxCount,
            percentage: getPercent(onlineCollection)
          },
          offline: {
            amount: offlineCollection,
            count: offlineTxCount,
            percentage: getPercent(offlineCollection)
          },
          total: {
            amount: totalCollection,
            count: totalTransactions
          }
        }
      }
    });

  } catch (error: any) {
    console.error("Mandal Financial Report Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Mandal financial report", error: error.message });
  }
};

