"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerWithdrawals = exports.requestSellerWithdrawal = exports.getSellerFinanceSummary = exports.getSellerLedger = void 0;
const prisma_1 = require("../../lib/prisma");
// Helper to get sellerId from userId (Seller role)
const getSellerStoreId = async (userId) => {
    const store = await prisma_1.prisma.sellerProfile.findUnique({
        where: { userId }
    });
    return store?.id;
};
// Get Ledger Entries for a Seller
const getSellerLedger = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sellerId = await getSellerStoreId(userId);
        if (!sellerId) {
            return res.status(404).json({ success: false, message: "Seller store not found" });
        }
        const entries = await prisma_1.prisma.templeLedger.findMany({
            where: { sellerId },
            orderBy: { createdAt: "desc" }
        });
        return res.status(200).json({ success: true, data: entries });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSellerLedger = getSellerLedger;
// Get Financial Summary for Seller Dashboard
const getSellerFinanceSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sellerId = await getSellerStoreId(userId);
        if (!sellerId) {
            return res.status(404).json({ success: false, message: "Seller store not found" });
        }
        // Fetch data in parallel
        const [ledger, withdrawals] = await Promise.all([
            prisma_1.prisma.templeLedger.findMany({ where: { sellerId } }),
            prisma_1.prisma.withdrawalRequest.findMany({
                where: { sellerId, status: { in: ["PENDING", "APPROVED", "PAID"] } }
            })
        ]);
        const now = new Date();
        // 3 Days escrow window
        // const escrowThreshold = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)); // Original
        const escrowThreshold = new Date(now.getTime()); // Testing: 0 Days
        // --- 1. Income Analysis ---
        const validIncomeEntries = ledger.filter((e) => e.type !== "WITHDRAWAL" && e.status !== "CANCELLED");
        const totalEarnings = validIncomeEntries.reduce((sum, e) => sum + (e.grossAmount || 0), 0);
        const totalCommission = validIncomeEntries.reduce((sum, e) => sum + (e.commission || 0), 0);
        const netEarnings = totalEarnings - totalCommission;
        // --- 2. Settlement Analysis ---
        const completedIncomeEntries = validIncomeEntries.filter((e) => e.status === "COMPLETED");
        const settledIncome = completedIncomeEntries
            .filter((e) => new Date(e.createdAt) <= escrowThreshold)
            .reduce((sum, e) => sum + e.amount, 0);
        const inEscrow = completedIncomeEntries
            .filter((e) => new Date(e.createdAt) > escrowThreshold)
            .reduce((sum, e) => sum + e.amount, 0);
        const pendingFulfillment = validIncomeEntries
            .filter((e) => e.status === "PENDING")
            .reduce((sum, e) => sum + e.amount, 0);
        // --- 3. Payout Analysis ---
        const totalPaidPayouts = withdrawals
            .filter((w) => w.status === "PAID")
            .reduce((sum, w) => sum + w.amount, 0);
        const processingWithdrawals = withdrawals
            .filter((w) => w.status === "PENDING" || w.status === "APPROVED")
            .reduce((sum, w) => sum + w.amount, 0);
        // --- 4. Final Balance ---
        const finalAvailable = settledIncome - totalPaidPayouts - processingWithdrawals;
        const pendingOrdersCount = validIncomeEntries.filter((e) => e.status === "PENDING").length;
        // --- 5. Revenue History (Last 30 Days) ---
        const revenueHistory = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            const dailySum = validIncomeEntries
                .filter((e) => new Date(e.createdAt).toISOString().split('T')[0] === dateStr)
                .reduce((sum, e) => sum + (e.amount || 0), 0);
            revenueHistory.push({ date: dateStr, name: displayDate, revenue: dailySum });
        }
        return res.status(200).json({
            success: true,
            data: {
                totalEarnings, // Gross Sales
                totalCommission,
                netEarnings,
                availableBalance: Math.max(0, finalAvailable),
                pendingBalance: pendingFulfillment,
                activeOrdersCount: pendingOrdersCount,
                inEscrow,
                processingWithdrawals,
                revenueHistory
            }
        });
    }
    catch (error) {
        console.error("Seller Finance Summary Error:", error);
        return res.status(500).json({ success: false, message: "Failed to load financial summary" });
    }
};
exports.getSellerFinanceSummary = getSellerFinanceSummary;
// Request Withdrawal
const requestSellerWithdrawal = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sellerId = await getSellerStoreId(userId);
        const { amount, bankDetails } = req.body;
        if (!sellerId) {
            return res.status(404).json({ success: false, message: "Seller store not found" });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            const now = new Date();
            // const escrowThreshold = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)); // Original 3 Days
            const escrowThreshold = new Date(now.getTime()); // Testing: 0 Days (Immediate)
            const ledger = await tx.templeLedger.findMany({
                where: {
                    sellerId,
                    status: "COMPLETED",
                    type: { not: "WITHDRAWAL" },
                    createdAt: { lte: escrowThreshold }
                }
            });
            const settledIncome = ledger.reduce((sum, e) => sum + e.amount, 0);
            const withdrawals = await tx.withdrawalRequest.findMany({
                where: { sellerId, status: { in: ["PENDING", "APPROVED", "PAID"] } }
            });
            const totalDebits = withdrawals.reduce((sum, w) => sum + w.amount, 0);
            const netAvailable = settledIncome - totalDebits;
            if (amount > netAvailable) {
                throw new Error(`Insufficient settled balance. Available: ₹${netAvailable}`);
            }
            await tx.withdrawalRequest.create({
                data: {
                    sellerId,
                    amount,
                    bankDetails,
                    status: "PENDING"
                }
            });
        });
        return res.status(201).json({ success: true, message: "Withdrawal request submitted successfully" });
    }
    catch (error) {
        console.error("Seller Withdrawal Request Error:", error);
        const statusCode = error.message.includes("Insufficient") ? 400 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};
exports.requestSellerWithdrawal = requestSellerWithdrawal;
// Get Withdrawal History
const getSellerWithdrawals = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sellerId = await getSellerStoreId(userId);
        if (!sellerId) {
            return res.status(404).json({ success: false, message: "Seller store not found" });
        }
        const withdrawals = await prisma_1.prisma.withdrawalRequest.findMany({
            where: { sellerId },
            orderBy: { createdAt: "desc" }
        });
        return res.status(200).json({ success: true, data: withdrawals });
    }
    catch (error) {
        console.error("Seller Withdrawal History Error:", error);
        return res.status(500).json({ success: false, message: "Failed to load withdrawal history" });
    }
};
exports.getSellerWithdrawals = getSellerWithdrawals;
