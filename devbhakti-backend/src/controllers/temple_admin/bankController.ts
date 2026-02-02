import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getBankDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const temple = await prisma.temple.findUnique({
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
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBankDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { bankName, accountNumber, accountHolderName, ifscCode, upiId } = req.body;

        const temple = await prisma.temple.findUnique({ where: { userId } });
        if (!temple) return res.status(404).json({ success: false, message: 'Temple not found' });

        const updatedTemple = await prisma.temple.update({
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
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
