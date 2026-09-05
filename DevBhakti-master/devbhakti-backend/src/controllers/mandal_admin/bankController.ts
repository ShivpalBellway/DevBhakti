import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getBankDetails = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const mandal = await prisma.mandal.findUnique({
            where: { id: mandalId },
            select: {
                id: true,
                bankName: true,
                accountNumber: true,
                accountHolderName: true,
                ifscCode: true,
                upiId: true
            }
        });

        if (!mandal) {
            return res.status(404).json({ success: false, message: 'Mandal not found' });
        }

        res.json({ success: true, data: mandal });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBankDetails = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const { bankName, accountNumber, accountHolderName, ifscCode, upiId } = req.body;

        const mandal = await prisma.mandal.findUnique({ where: { id: mandalId } });
        if (!mandal) return res.status(404).json({ success: false, message: 'Mandal not found' });

        const updatedMandal = await prisma.mandal.update({
            where: { id: mandalId },
            data: {
                bankName,
                accountNumber,
                accountHolderName,
                ifscCode,
                upiId
            },
            select: {
                id: true,
                bankName: true,
                accountNumber: true,
                accountHolderName: true,
                ifscCode: true,
                upiId: true
            }
        });

        res.json({
            success: true,
            message: 'Bank details saved successfully.',
            data: updatedMandal
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
