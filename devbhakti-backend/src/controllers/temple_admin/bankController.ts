import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notifyAdmins } from '../../services/firebaseService';

export const getBankDetails = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const temple = await prisma.temple.findUnique({
            where: { id: templeId },
            select: {
                id: true,
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

        // Check for pending update request
        const pendingRequest = await prisma.templeUpdateRequest.findFirst({
            where: {
                templeId: temple.id,
                status: 'PENDING'
            },
            orderBy: { createdAt: 'desc' }
        });

        const data = {
            ...temple,
            verificationPending: !!pendingRequest,
            pendingData: pendingRequest ? pendingRequest.requestedData : null
        };

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBankDetails = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const { bankName, accountNumber, accountHolderName, ifscCode, upiId } = req.body;

        const temple = await prisma.temple.findUnique({ where: { id: templeId } });
        if (!temple) return res.status(404).json({ success: false, message: 'Temple not found' });

        // Check if there is already a pending request
        const existingRequest = await prisma.templeUpdateRequest.findFirst({
            where: {
                templeId: temple.id,
                status: 'PENDING'
            }
        });

        const requestedData = {
            bankName,
            accountNumber,
            accountHolderName,
            ifscCode,
            upiId
        };

        const oldData = {
            bankName: temple.bankName,
            accountNumber: temple.accountNumber,
            accountHolderName: temple.accountHolderName,
            ifscCode: temple.ifscCode,
            upiId: temple.upiId
        };

        if (existingRequest) {
            // Update existing pending request
            await prisma.templeUpdateRequest.update({
                where: { id: existingRequest.id },
                data: {
                    requestedData,
                    oldData
                }
            });
        } else {
            // Create new request
            await prisma.templeUpdateRequest.create({
                data: {
                    templeId: temple.id,
                    requestedData,
                    oldData,
                    status: 'PENDING'
                }
            });
        }

        await notifyAdmins({
            title: "Temple Bank Detail Update",
            body: `${temple.name || 'A Temple'} has submitted bank details for verification.`,
            data: {
                link: '/admin/temples/update-requests',
                type: 'TEMPLE_UPDATE'
            }
        });

        res.json({
            success: true,
            message: 'Bank details submitted for verification.',
            verificationPending: true
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
