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
        // Fetch donations and teller orders in parallel
        const [donations, tellerOrders] = await Promise.all([
          prisma.donation.findMany({
            where: { id: { in: sourceIds } },
            include: { user: { select: { name: true } } }
          }),
          prisma.tellerOrder.findMany({
            where: { id: { in: sourceIds } },
            include: { items: true }
          })
        ]);

        const donationMap = new Map(donations.map(d => [d.id, d]));
        const tellerOrderMap = new Map(tellerOrders.map(t => [t.id, t]));

        enrichedEntries = entries.map(entry => {
          if (entry.sourceId) {
            if (entry.type === "DONATION_EARNING") {
              const donation = donationMap.get(entry.sourceId);
              if (donation) {
                return {
                  ...entry,
                  orderDetail: {
                    displayId: donation.displayId || donation.id.slice(-8).toUpperCase(),
                    customerName: donation.donorName || donation.user?.name || "Anonymous",
                    paymentStatus: "PAID",
                    deliveryStatus: "COMPLETED"
                  }
                };
              }
            } else if (entry.type === "MARKETPLACE_EARNING" || entry.type === "POOJA_EARNING") {
              const tellerOrder = tellerOrderMap.get(entry.sourceId);
              if (tellerOrder) {
                return {
                  ...entry,
                  orderDetail: {
                    displayId: tellerOrder.displayId,
                    customerName: tellerOrder.devoteeName || "Counter Devotee",
                    paymentStatus: tellerOrder.paymentStatus,
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

    const {
      period = "this_month",
      startDate: customStartDate,
      endDate: customEndDate,
      page = "1",
      limit = "10",
      category: filterCategory,
      channel: filterChannel,
      search: filterSearch
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 10));

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
      status: { in: ["COMPLETED", "PAID", "DELIVERED", "PROCESSING", "SHIPPED", "PENDING"] },
      createdAt: { gte: rangeStart, lte: rangeEnd }
    };

    const rangeTellerOrderWhere = {
      mandalId,
      paymentStatus: { in: ["PAID", "COMPLETED", "SUCCESS"] },
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
      prisma.poojaBooking.findMany({ where: rangePoojaWhere, include: { user: { select: { name: true, phone: true, email: true } } } }),
      prisma.donation.findMany({ where: rangeDonationWhere, include: { user: { select: { name: true, phone: true, email: true } } } }),
      prisma.subOrder.findMany({ where: rangeSubOrderWhere, include: { order: { include: { user: { select: { name: true, phone: true, email: true } } } } } }),
      prisma.tellerOrder.findMany({ where: rangeTellerOrderWhere, include: { items: true } }),
      prisma.mandalDarshanTicket.findMany({ where: rangeTicketWhere, include: { user: { select: { name: true, phone: true, email: true } } } }),
      prisma.poojaBooking.findMany({ where: todayPoojaWhere }),
      prisma.donation.findMany({ where: todayDonationWhere }),
      prisma.subOrder.findMany({ where: todaySubOrderWhere }),
      prisma.tellerOrder.findMany({ where: todayTellerOrderWhere, include: { items: true } }),
      prisma.mandalDarshanTicket.findMany({ where: todayTicketWhere })
    ]);

    const getTellerProductTotal = (t: any) => {
      if (!t.items || t.items.length === 0) return 0;
      return t.items
        .filter((it: any) => {
          const type = (it.itemType || '').toUpperCase().trim();
          const name = (it.itemName || '').toLowerCase().trim();
          if (type.includes('DONAT') || type.includes('POOJA') || type.includes('TICKET') || type.includes('DARSHAN')) return false;
          if (name.includes('donat') || name.includes('pooja') || name.includes('ticket') || name.includes('darshan')) return false;
          if (type.includes('PROD') || type.includes('PRASAD') || type.includes('MARKET') || type.includes('ITEM') || !type) return true;
          return true;
        })
        .reduce((sum: number, it: any) => {
          const lineVal = Number(it.totalPrice) || (Number(it.unitPrice || 0) * Number(it.quantity || 1)) || 0;
          return sum + lineVal;
        }, 0);
    };

    const todayPoojaAmount = todayPoojas.reduce((sum, b) => sum + (b.packagePrice || 0) + (b.prasadAmount || 0), 0);
    const todayDonationAmount = todayDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const todaySacredItemsAmount = todaySubOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) + todayTellerOrders.reduce((sum, t) => sum + getTellerProductTotal(t), 0);
    const todayTicketingAmount = todayTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const todayTotalCollection = todayPoojaAmount + todayDonationAmount + todaySacredItemsAmount + todayTicketingAmount;

    const poojaAmount = rangePoojas.reduce((sum, b) => sum + (b.packagePrice || 0) + (b.prasadAmount || 0), 0);
    const donationAmount = rangeDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const sacredItemsAmount = rangeSubOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) + rangeTellerOrders.reduce((sum, t) => sum + getTellerProductTotal(t), 0);
    const ticketingAmount = rangeTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const totalCollection = poojaAmount + donationAmount + sacredItemsAmount + ticketingAmount;
    const tellerProductTxCount = rangeTellerOrders.filter(t => getTellerProductTotal(t) > 0).length;
    const totalTransactions = rangePoojas.length + rangeDonations.length + rangeSubOrders.length + tellerProductTxCount + rangeTickets.length;
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

    const allTransactionsList: any[] = [];

    rangePoojas.forEach(b => {
      const amt = (b.packagePrice || 0) + (b.prasadAmount || 0);
      const isOff = b.isOffline || b.bookingSource === "MANDAL_OFFLINE" || b.bookingSource === "COUNTER" || b.bookingSource === "TELLER" || !b.razorpayOrderId;
      const mode = normalizePaymentMode(b.paymentMethod || (isOff ? "Cash" : "UPI"));

      allTransactionsList.push({
        id: b.id,
        receiptNo: b.displayId || b.id,
        category: "POOJA_SEVA",
        categoryName: "Pooja & Seva",
        title: b.packageName || "Pooja Booking",
        amount: amt,
        channel: isOff ? "OFFLINE" : "ONLINE",
        paymentMode: mode,
        status: b.status,
        createdAt: b.createdAt,
        devotee: {
          name: b.devoteeName || (b.user ? b.user.name : "Devotee"),
          phone: b.devoteePhone || (b.user ? b.user.phone : ""),
          email: b.devoteeEmail || (b.user ? b.user.email : "")
        }
      });
    });

    rangeDonations.forEach(d => {
      const amt = d.amount || 0;
      const isOff = !d.razorpayOrderId || d.paymentMethod === "CASH";
      const mode = normalizePaymentMode(d.paymentMethod || (isOff ? "Cash" : "UPI"));

      const donationObj = d as any;
      allTransactionsList.push({
        id: d.id,
        receiptNo: donationObj.receiptNo || donationObj.transactionRef || d.id,
        category: "DONATIONS",
        categoryName: "Donation",
        title: d.donorName ? `Donation from ${d.donorName}` : "Mandal Donation",
        amount: amt,
        channel: isOff ? "OFFLINE" : "ONLINE",
        paymentMode: mode,
        status: d.status,
        createdAt: d.createdAt,
        devotee: {
          name: d.donorName || (d.user ? d.user.name : "Anonymous Donor"),
          phone: donationObj.phone || (d.user ? d.user.phone : ""),
          email: donationObj.email || (d.user ? d.user.email : "")
        }
      });
    });

    rangeSubOrders.forEach(o => {
      const subOrderObj = o as any;
      const amt = o.totalAmount || 0;
      const isOff = !o.order?.razorpayOrderId;
      const mode = normalizePaymentMode(o.order?.paymentMethod || (isOff ? "Cash" : "UPI"));

      allTransactionsList.push({
        id: o.id,
        receiptNo: subOrderObj.subOrderNumber || o.id,
        category: "SACRED_ITEMS",
        categoryName: "Sacred Items",
        title: `Marketplace Order #${subOrderObj.subOrderNumber || o.id.slice(-6)}`,
        amount: amt,
        channel: isOff ? "OFFLINE" : "ONLINE",
        paymentMode: mode,
        status: o.status,
        createdAt: o.createdAt,
        devotee: {
          name: o.order?.user?.name || "Customer",
          phone: o.order?.user?.phone || "",
          email: o.order?.user?.email || ""
        }
      });
    });

    rangeTellerOrders.forEach(t => {
      const amt = getTellerProductTotal(t);
      if (amt <= 0) return;

      const tellerObj = t as any;
      const mode = normalizePaymentMode(t.paymentMethod || "Cash");

      const productItemNames = (t.items || [])
        .filter((it: any) => {
          const type = (it.itemType || '').toUpperCase().trim();
          const name = (it.itemName || '').toLowerCase().trim();
          if (type.includes('DONAT') || type.includes('POOJA') || type.includes('TICKET') || type.includes('DARSHAN')) return false;
          if (name.includes('donat') || name.includes('pooja') || name.includes('ticket') || name.includes('darshan')) return false;
          return true;
        })
        .map((it: any) => it.itemName)
        .filter(Boolean)
        .join(", ");

      allTransactionsList.push({
        id: t.id,
        receiptNo: tellerObj.receiptNumber || t.displayId || t.id,
        category: "SACRED_ITEMS",
        categoryName: "Sacred Items",
        title: productItemNames ? `Sacred Items (${productItemNames})` : "Counter Sacred Items Sale",
        amount: amt,
        channel: "OFFLINE",
        paymentMode: mode,
        status: t.paymentStatus,
        createdAt: t.createdAt,
        devotee: {
          name: t.devoteeName || "Devotee",
          phone: t.devoteePhone || "",
          email: t.devoteeEmail || ""
        }
      });
    });

    rangeTickets.forEach(t => {
      const amt = t.totalAmount || 0;
      const isOff = t.paymentMethod === "CASH" || !t.paymentMethod;
      const mode = normalizePaymentMode(t.paymentMethod || (isOff ? "Cash" : "UPI"));

      allTransactionsList.push({
        id: t.id,
        receiptNo: t.displayId || t.id,
        category: "TICKETING",
        categoryName: "Darshan Ticket",
        title: `Darshan Ticket (${t.visitorCount || 1} Person)`,
        amount: amt,
        channel: isOff ? "OFFLINE" : "ONLINE",
        paymentMode: mode,
        status: t.status,
        createdAt: t.createdAt,
        devotee: {
          name: t.visitorName || (t.user ? t.user.name : "Devotee"),
          phone: t.visitorPhone || (t.user ? t.user.phone : ""),
          email: t.visitorEmail || (t.user ? t.user.email : "")
        }
      });
    });

    // Sort transactions descending by createdAt date
    allTransactionsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate aggregated online/offline channel summary & payment mode summary dynamically from allTransactionsList
    allTransactionsList.forEach(t => {
      const amt = Number(t.amount || 0);
      const isOff = t.channel === "OFFLINE";
      if (isOff) {
        offlineCollection += amt;
        offlineTxCount++;
      } else {
        onlineCollection += amt;
        onlineTxCount++;
      }
      const mode = t.paymentMode || "Cash";
      paymentModes[mode] = (paymentModes[mode] || 0) + amt;
    });

    // Filter transaction list if optional filter parameters are passed
    let filteredTransactions = allTransactionsList;

    if (filterCategory && String(filterCategory).toUpperCase() !== "ALL") {
      filteredTransactions = filteredTransactions.filter(
        t => t.category.toUpperCase() === String(filterCategory).toUpperCase()
      );
    }

    if (filterChannel && String(filterChannel).toUpperCase() !== "ALL") {
      filteredTransactions = filteredTransactions.filter(
        t => t.channel.toUpperCase() === String(filterChannel).toUpperCase()
      );
    }

    if (filterSearch && String(filterSearch).trim() !== "") {
      const s = String(filterSearch).toLowerCase().trim();
      filteredTransactions = filteredTransactions.filter(
        t =>
          (t.receiptNo && t.receiptNo.toLowerCase().includes(s)) ||
          (t.title && t.title.toLowerCase().includes(s)) ||
          (t.devotee?.name && t.devotee.name.toLowerCase().includes(s)) ||
          (t.devotee?.phone && t.devotee.phone.toLowerCase().includes(s)) ||
          (t.devotee?.email && t.devotee.email.toLowerCase().includes(s))
      );
    }

    // Pagination for transaction list
    const totalTxCount = filteredTransactions.length;
    const totalPages = Math.ceil(totalTxCount / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + limitNum);

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
        },
        transactions: {
          pagination: {
            total: totalTxCount,
            page: pageNum,
            limit: limitNum,
            totalPages
          },
          list: paginatedTransactions
        }
      }
    });

  } catch (error: any) {
    console.error("Mandal Financial Report Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Mandal financial report", error: error.message });
  }
};

