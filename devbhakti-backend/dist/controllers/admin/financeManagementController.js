"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPlatformTransactions = exports.getPlatformFinanceSummary = exports.updateWithdrawalStatus = exports.getAllWithdrawalRequests = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all withdrawal requests for admin
const getAllWithdrawalRequests = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error in getAllWithdrawalRequests:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllWithdrawalRequests = getAllWithdrawalRequests;
// Admin updates withdrawal status (Approve/Reject/Paid)
const updateWithdrawalStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, adminNotes, transactionId } = req.body;
        const receiptImage = req.file ? `/uploads/${req.file.filename}` : undefined;
        const request = await prisma.withdrawalRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        const updated = await prisma.withdrawalRequest.update({
            where: { id: requestId },
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
                where: { sourceId: requestId, type: "WITHDRAWAL" }
            });
            if (!existingLedger) {
                await prisma.templeLedger.create({
                    data: {
                        templeId: request.templeId,
                        amount: -request.amount, // Negative for withdrawal
                        type: "WITHDRAWAL",
                        sourceId: requestId,
                        description: `Payout processed (ID: ${requestId.slice(-6).toUpperCase()})`,
                        status: "COMPLETED"
                    }
                });
            }
        }
        return res.status(200).json({ success: true, message: `Withdrawal request ${status}`, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateWithdrawalStatus = updateWithdrawalStatus;
// Get Platform Financial Stats for Admin
const getPlatformFinanceSummary = async (req, res) => {
    console.log("Fetching platform finance summary...");
    try {
        const ledger = await prisma.templeLedger.findMany({
            where: {
                type: { not: "WITHDRAWAL" },
                status: { not: "CANCELLED" }
            }
        });
        const totalRevenue = ledger.reduce((sum, e) => sum + (Number(e.grossAmount) || 0), 0);
        const totalCommission = ledger.reduce((sum, e) => sum + (Number(e.commission) || 0), 0);
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
                totalPaidOut: totalPayouts._sum.amount || 0
            }
        });
    }
    catch (error) {
        console.error("Error in getPlatformFinanceSummary:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPlatformFinanceSummary = getPlatformFinanceSummary;
// Get all ledger entries for platform-wide monitoring
const getAllPlatformTransactions = async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllPlatformTransactions = getAllPlatformTransactions;
