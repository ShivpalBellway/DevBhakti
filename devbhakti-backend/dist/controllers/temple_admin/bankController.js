"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBankDetails = exports.getBankDetails = void 0;
const prisma_1 = require("../../lib/prisma");
const getBankDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const temple = await prisma_1.prisma.temple.findUnique({
            where: { userId },
            select: {
                bankName: true,
                accountNumber: true,
                accountHolderName: true,
                ifscCode: true,
                upiId: true
            }
        });
        if (!temple) {
            return res.status(404).json({ success: false, message: 'Temple not found' });
        }
        res.json({ success: true, data: temple });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBankDetails = getBankDetails;
const updateBankDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bankName, accountNumber, accountHolderName, ifscCode, upiId } = req.body;
        const temple = await prisma_1.prisma.temple.findUnique({ where: { userId } });
        if (!temple)
            return res.status(404).json({ success: false, message: 'Temple not found' });
        const updatedTemple = await prisma_1.prisma.temple.update({
            where: { userId },
            data: {
                bankName,
                accountNumber,
                accountHolderName,
                ifscCode,
                upiId
            }
        });
        res.json({ success: true, message: 'Bank details updated successfully', data: updatedTemple });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateBankDetails = updateBankDetails;
