import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getPendingApprovals = async (req: Request, res: Response) => {
    try {
        // Fetch Temple Requests
        const templeRequests = await prisma.templeUpdateRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                temple: {
                    select: { name: true, templeId: true, userId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch Seller Requests safely
        let sellerRequests: any[] = [];

        // Runtime check for the new model
        if ((prisma as any).sellerUpdateRequest) {
            try {
                sellerRequests = await (prisma as any).sellerUpdateRequest.findMany({
                    where: { status: 'PENDING' },
                    include: {
                        seller: {
                            select: { name: true, id: true, userId: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            } catch (err) {
                console.error("Error fetching seller requests:", err);
            }
        } else {
            console.warn("sellerUpdateRequest model not found in Prisma Client. Run 'npx prisma generate'.");
        }

        // Normalize data structure for frontend
        const normalizedTempleRequests = templeRequests.map((req: any) => ({
            id: req.id,
            type: 'TEMPLE',
            entityName: req.temple.name,
            entityId: req.temple.userId,
            requestedData: req.requestedData,
            oldData: req.oldData,
            createdAt: req.createdAt,
            status: req.status
        }));

        const normalizedSellerRequests = sellerRequests.map((req: any) => ({
            id: req.id,
            type: 'SELLER',
            entityName: req.seller.name,
            entityId: req.seller.userId,
            requestedData: req.requestedData,
            oldData: req.oldData,
            createdAt: req.createdAt,
            status: req.status
        }));

        res.json({
            success: true,
            data: [...normalizedTempleRequests, ...normalizedSellerRequests].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        });

    } catch (error: any) {
        console.error('Fetch Approvals Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch approvals' });
    }
};

export const approveRequest = async (req: Request, res: Response) => {
    try {
        const { id, type } = req.body; // type: 'TEMPLE' | 'SELLER'

        if (!id || !type) {
            return res.status(400).json({ success: false, message: 'Missing ID or Type' });
        }

        if (type === 'TEMPLE') {
            const request = await prisma.templeUpdateRequest.findUnique({ where: { id } });
            if (!request || request.status !== 'PENDING') {
                return res.status(404).json({ success: false, message: 'Request not found or already processed' });
            }

            // Apply updates
            const dataToUpdate = request.requestedData as any;

            await prisma.$transaction([
                prisma.temple.update({
                    where: { id: request.templeId },
                    data: dataToUpdate
                }),
                prisma.templeUpdateRequest.update({
                    where: { id },
                    data: { status: 'APPROVED' }
                })
            ]);

        } else if (type === 'SELLER') {
            // @ts-ignore
            const request = await prisma.sellerUpdateRequest.findUnique({ where: { id } });
            if (!request || request.status !== 'PENDING') {
                return res.status(404).json({ success: false, message: 'Request not found or already processed' });
            }

            // Apply updates
            const dataToUpdate = request.requestedData as any;

            await prisma.$transaction([
                prisma.sellerProfile.update({
                    where: { id: request.sellerId },
                    data: dataToUpdate
                }),
                // @ts-ignore
                prisma.sellerUpdateRequest.update({
                    where: { id },
                    data: { status: 'APPROVED' }
                })
            ]);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid Type' });
        }

        res.json({ success: true, message: 'Request approved successfully' });

    } catch (error: any) {
        console.error('Approve Request Error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve request' });
    }
};

export const rejectRequest = async (req: Request, res: Response) => {
    try {
        const { id, type } = req.body;

        if (!id || !type) {
            return res.status(400).json({ success: false, message: 'Missing ID or Type' });
        }

        if (type === 'TEMPLE') {
            await prisma.templeUpdateRequest.update({
                where: { id },
                data: { status: 'REJECTED' }
            });
        } else if (type === 'SELLER') {
            // @ts-ignore
            await prisma.sellerUpdateRequest.update({
                where: { id },
                data: { status: 'REJECTED' }
            });
        }

        res.json({ success: true, message: 'Request rejected' });

    } catch (error: any) {
        console.error('Reject Request Error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject request' });
    }
};
