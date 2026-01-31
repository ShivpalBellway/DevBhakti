"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestWithdrawal = exports.getTempleFinanceSummary = exports.getTempleLedger = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get Ledger Entries for a Temple
const getTempleLedger = async (req, res) => {
    try {
        const { templeId } = req.params;
        const entries = await prisma.templeLedger.findMany({
            where: { templeId },
            orderBy: { createdAt: "desc" }
        });
        return res.status(200).json({ success: true, data: entries });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTempleLedger = getTempleLedger;
// Get Financial Summary for Temple Dashboard
const getTempleFinanceSummary = async (req, res) => {
    try {
        const { templeId } = req.params;
        const ledger = await prisma.templeLedger.findMany({
            where: { templeId }
        });
        const withdrawals = await prisma.withdrawalRequest.findMany({
            where: { templeId, status: { in: ["PENDING", "APPROVED", "PAID"] } }
        });
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        // 1. Gross Earnings
        const totalEarnings = ledger
            .filter((e) => e.type !== "WITHDRAWAL" && e.status !== "CANCELLED")
            .reduce((sum, e) => sum + (e.grossAmount || 0), 0);
        const totalCommission = ledger
            .filter((e) => e.type !== "WITHDRAWAL" && e.status !== "CANCELLED")
            .reduce((sum, e) => sum + (e.commission || 0), 0);
        const netEarnings = totalEarnings - totalCommission;
        // 2. Total Completed (regardless of escrow)
        const totalCompletedRaw = ledger
            .filter((e) => e.status === "COMPLETED" && e.type !== "WITHDRAWAL")
            .reduce((sum, e) => sum + e.amount, 0);
        // 3. Available (Completed AND > 3 days old)
        const totalAvailableRaw = ledger
            .filter((e) => e.status === "COMPLETED" && e.type !== "WITHDRAWAL" && new Date(e.createdAt) <= threeDaysAgo)
            .reduce((sum, e) => sum + e.amount, 0);
        // 4. In Escrow (Completed BUT < 3 days old)
        const inEscrow = totalCompletedRaw - totalAvailableRaw;
        // 5. Total Paid Withdrawals
        const totalPaidWithdrawals = withdrawals
            .filter((w) => w.status === "PAID")
            .reduce((sum, w) => sum + w.amount, 0);
        // 6. Processing Withdrawals (LOCKED)
        const processingWithdrawals = withdrawals
            .filter((w) => w.status === "PENDING" || w.status === "APPROVED")
            .reduce((sum, w) => sum + w.amount, 0);
        // 7. Net Available for Payout
        const finalAvailable = totalAvailableRaw - totalPaidWithdrawals - processingWithdrawals;
        // 8. Pending Fulfillment
        const pendingFulfillment = ledger
            .filter((e) => e.status === "PENDING" && e.type !== "WITHDRAWAL")
            .reduce((sum, e) => sum + e.amount, 0);
        return res.status(200).json({
            success: true,
            data: {
                totalEarnings, // Gross
                totalCommission,
                netEarnings,
                availableBalance: Math.max(0, finalAvailable),
                pendingBalance: pendingFulfillment,
                inEscrow,
                processingWithdrawals
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTempleFinanceSummary = getTempleFinanceSummary;
// Request Withdrawal
const requestWithdrawal = async (req, res) => {
    try {
        const { templeId, amount, bankDetails } = req.body;
        // Check available balance
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const ledger = await prisma.templeLedger.findMany({
            where: {
                templeId,
                status: "COMPLETED",
                type: { not: "WITHDRAWAL" },
                createdAt: { lte: threeDaysAgo } // Only funds past escrow
            }
        });
        const totalAvailableEarnings = ledger.reduce((sum, e) => sum + e.amount, 0);
        const withdrawals = await prisma.withdrawalRequest.findMany({
            where: { templeId, status: { in: ["PENDING", "APPROVED", "PAID"] } }
        });
        const totalWithdrawnAndLocked = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        const netAvailable = totalAvailableEarnings - totalWithdrawnAndLocked;
        if (amount > netAvailable) {
            return res.status(400).json({ success: false, message: `Insufficient settled balance. Settled: ₹${netAvailable}` });
        }
        const request = await prisma.withdrawalRequest.create({
            data: {
                templeId,
                amount,
                bankDetails,
                status: "PENDING"
            }
        });
        return res.status(201).json({ success: true, message: "Withdrawal request submitted", data: request });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.requestWithdrawal = requestWithdrawal;
