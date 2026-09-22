import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

export const getReceiptConfig = async (req: any, res: Response) => {
    try {
        const mandalId = req.owner?.ownerId || req.user?.mandalId || req.user?.ownerId;
        if (!mandalId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Mandal account required.' });
        }

        const mandal = await prisma.mandal.findUnique({
            where: { id: mandalId },
            select: { id: true, name: true, address: true, city: true, slug: true, receiptConfig: true } as any
        });

        if (!mandal) {
            return res.status(404).json({ success: false, message: 'Mandal not found.' });
        }

        let config = (mandal as any)?.receiptConfig;
        if (typeof config === 'string') {
            try {
                config = JSON.parse(config);
            } catch (e) {
                config = {};
            }
        }

        return res.json({
            success: true,
            data: {
                mandalId: mandal.id,
                mandalName: mandal.name,
                mandalAddress: mandal.address,
                mandalSlug: mandal.slug,
                receiptConfig: config || { headerBanner: null, sponsors: [], customThankYouNote: "" }
            }
        });
    } catch (error: any) {
        console.error("Error in getReceiptConfig:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

export const updateReceiptConfig = async (req: any, res: Response) => {
    try {
        const mandalId = req.owner?.ownerId || req.user?.mandalId || req.user?.ownerId;
        if (!mandalId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Mandal account required.' });
        }

        const mandal = await prisma.mandal.findUnique({
            where: { id: mandalId }
        });

        if (!mandal) {
            return res.status(404).json({ success: false, message: 'Mandal not found.' });
        }

        let existingConfig: any = (mandal as any).receiptConfig || {};
        if (typeof existingConfig === 'string') {
            try {
                existingConfig = JSON.parse(existingConfig);
            } catch (e) {
                existingConfig = {};
            }
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        let headerBannerPath: string | null = existingConfig.headerBanner || null;

        if (req.body.removeReceiptHeader === "true") {
            headerBannerPath = null;
        }

        if (files && files['receiptHeaderBanner'] && files['receiptHeaderBanner'][0]) {
            headerBannerPath = `/uploads/mandals/${files['receiptHeaderBanner'][0].filename}`;
        }

        let sponsors: any[] = [];

        if (req.body.existingSponsors) {
            try {
                const parsedExisting = JSON.parse(req.body.existingSponsors);
                if (Array.isArray(parsedExisting)) {
                    sponsors = parsedExisting;
                }
            } catch (e) {
                console.error("Failed to parse existingSponsors", e);
            }
        } else if (Array.isArray(existingConfig.sponsors)) {
            sponsors = existingConfig.sponsors;
        }

        if (files && files['sponsorBanners'] && files['sponsorBanners'].length > 0) {
            files['sponsorBanners'].forEach((file, index) => {
                sponsors.push({
                    id: `sp_${Date.now()}_${index}`,
                    imageUrl: `/uploads/mandals/${file.filename}`,
                    name: req.body[`sponsorName_${index}`] || `Sponsor ${sponsors.length + 1}`,
                    order: sponsors.length + 1
                });
            });
        }

        sponsors = sponsors.slice(0, 5);

        let customThankYouNote = existingConfig.customThankYouNote || "";
        if (req.body.receiptConfig) {
            try {
                const parsedConfig = JSON.parse(req.body.receiptConfig);
                if (parsedConfig.customThankYouNote !== undefined) {
                    customThankYouNote = parsedConfig.customThankYouNote;
                }
            } catch (e) {
                console.error("Failed to parse receiptConfig body", e);
            }
        }
        if (req.body.customThankYouNote !== undefined) {
            customThankYouNote = req.body.customThankYouNote;
        }

        const updatedConfig = {
            headerBanner: headerBannerPath,
            sponsors,
            customThankYouNote
        };

        const updatedMandal = await prisma.mandal.update({
            where: { id: mandalId },
            data: {
                receiptConfig: updatedConfig as any
            } as any
        });

        return res.json({
            success: true,
            message: 'Receipt configuration updated successfully.',
            data: updatedConfig
        });
    } catch (error: any) {
        console.error("Error in updateReceiptConfig:", error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to update receipt configuration' });
    }
};

export const getPublicReceiptConfig = async (req: any, res: Response) => {
    try {
        const { idOrSlug } = req.params;
        const mandal = await prisma.mandal.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            select: { id: true, name: true, address: true, city: true, slug: true, receiptConfig: true } as any
        });

        if (!mandal) {
            return res.status(404).json({ success: false, message: 'Mandal not found.' });
        }

        let config = (mandal as any)?.receiptConfig;
        if (typeof config === 'string') {
            try {
                config = JSON.parse(config);
            } catch (e) {
                config = {};
            }
        }

        return res.json({
            success: true,
            data: {
                mandalId: mandal.id,
                mandalName: mandal.name,
                mandalSlug: mandal.slug,
                receiptConfig: config || { headerBanner: null, sponsors: [], customThankYouNote: "" }
            }
        });
    } catch (error: any) {
        console.error("Error in getPublicReceiptConfig:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
