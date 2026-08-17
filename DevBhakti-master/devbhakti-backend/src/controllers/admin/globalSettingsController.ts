import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

const RATINGS_SETTINGS_KEY = 'ratings_management';
const SEO_SETTINGS_KEY = 'seo_meta_tags';
const MANDAL_REGISTRATION_KEY = 'mandal_registration_enabled';


export const getRatingsSettings = async (req: Request, res: Response) => {
    try {
        let settings = await prisma.globalSetting.findUnique({
            where: { key: RATINGS_SETTINGS_KEY }
        });

        // Initialize if not exists
        if (!settings) {
            const defaultSettings = {
                temple: { home: false, details: false },
                product: { home: false, details: false },
                pooja: { home: false, details: false }
            };
            settings = await prisma.globalSetting.create({
                data: {
                    key: RATINGS_SETTINGS_KEY,
                    value: defaultSettings
                }
            });
        }

        res.json({ success: true, settings: settings.value });
    } catch (error) {
        console.error('Error fetching ratings settings:', error);
        res.status(500).json({ success: false, message: 'Error fetching ratings settings' });
    }
};

export const updateRatingsSettings = async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;

        if (!settings) {
            return res.status(400).json({ success: false, message: 'Settings data is required' });
        }

        const updated = await prisma.globalSetting.upsert({
            where: { key: RATINGS_SETTINGS_KEY },
            update: { value: settings },
            create: {
                key: RATINGS_SETTINGS_KEY,
                value: settings
            }
        });

        res.json({ success: true, message: 'Ratings settings updated successfully', settings: updated.value });
    } catch (error) {
        console.error('Error updating ratings settings:', error);
        res.status(500).json({ success: false, message: 'Error updating ratings settings' });
    }
};

export const getSeoSettings = async (req: Request, res: Response) => {
    try {
        let settings = await prisma.globalSetting.findUnique({
            where: { key: SEO_SETTINGS_KEY }
        });

        // Initialize if not exists
        if (!settings) {
            const defaultSettings = {
                home: { title: "DevBhakti - Sacred Temple Service", description: "Connecting devotees with sacred temples", keywords: "temple, pooja, darshan" },
            };
            settings = await prisma.globalSetting.create({
                data: {
                    key: SEO_SETTINGS_KEY,
                    value: defaultSettings
                }
            });
        }

        res.json({ success: true, settings: settings.value });
    } catch (error) {
        console.error('Error fetching SEO settings:', error);
        res.status(500).json({ success: false, message: 'Error fetching SEO settings' });
    }
};

export const updateSeoSettings = async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;

        if (!settings) {
            return res.status(400).json({ success: false, message: 'SEO data is required' });
        }

        const updated = await prisma.globalSetting.upsert({
            where: { key: SEO_SETTINGS_KEY },
            update: { value: settings },
            create: {
                key: SEO_SETTINGS_KEY,
                value: settings
            }
        });

        res.json({ success: true, message: 'SEO settings updated successfully', settings: updated.value });
    } catch (error) {
        console.error('Error updating SEO settings:', error);
        res.status(500).json({ success: false, message: 'Error updating SEO settings' });
    }
};

// ─── Mandal Registration Toggle ───────────────────────────────────────────────

// PUBLIC & ADMIN: Fetch mandal registration settings (enabled, title, subtitle, image, festival dates)
export const getMandalRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const setting = await prisma.globalSetting.findUnique({
            where: { key: MANDAL_REGISTRATION_KEY }
        });
        const val = (setting?.value as any) || {};
        const enabled = val.enabled === true;
        const settings = {
            enabled,
            title: val.title || { en: '', hi: '', mr: '' },
            subtitle: val.subtitle || { en: '', hi: '', mr: '' },
            image: val.image || '',
            startDate: val.startDate || '',
            endDate: val.endDate || ''
        };
        res.json({ success: true, ...settings });
    } catch (error) {
        console.error('Error fetching mandal registration status:', error);
        res.status(500).json({ success: false, message: 'Error fetching mandal registration status' });
    }
};

// ADMIN: Update mandal registration settings (toggle ON/OFF, title, subtitle, image, dates)
export const updateMandalRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const existing = await prisma.globalSetting.findUnique({
            where: { key: MANDAL_REGISTRATION_KEY }
        });
        const prevVal = (existing?.value as any) || {};

        let enabled = req.body.enabled;
        if (typeof enabled === 'string') {
            enabled = enabled === 'true';
        }

        let title = req.body.title;
        if (typeof title === 'string') {
            try {
                title = JSON.parse(title);
            } catch (e) {
                title = undefined;
            }
        }
        if (!title || typeof title !== 'object') {
            title = {
                en: req.body.title_en ?? req.body['title.en'] ?? prevVal.title?.en ?? '',
                hi: req.body.title_hi ?? req.body['title.hi'] ?? prevVal.title?.hi ?? '',
                mr: req.body.title_mr ?? req.body['title.mr'] ?? prevVal.title?.mr ?? ''
            };
        }

        let subtitle = req.body.subtitle;
        if (typeof subtitle === 'string') {
            try {
                subtitle = JSON.parse(subtitle);
            } catch (e) {
                subtitle = undefined;
            }
        }
        if (!subtitle || typeof subtitle !== 'object') {
            subtitle = {
                en: req.body.subtitle_en ?? req.body['subtitle.en'] ?? prevVal.subtitle?.en ?? '',
                hi: req.body.subtitle_hi ?? req.body['subtitle.hi'] ?? prevVal.subtitle?.hi ?? '',
                mr: req.body.subtitle_mr ?? req.body['subtitle.mr'] ?? prevVal.subtitle?.mr ?? ''
            };
        }

        let image = prevVal.image || '';
        if (req.file) {
            image = `/uploads/cms/mandal/${req.file.filename}`;
        } else if (req.body.image !== undefined) {
            image = req.body.image;
        }

        const startDate = req.body.startDate !== undefined ? req.body.startDate : (prevVal.startDate || '');
        const endDate = req.body.endDate !== undefined ? req.body.endDate : (prevVal.endDate || '');

        const newSettings = {
            enabled: enabled !== undefined ? Boolean(enabled) : (prevVal.enabled ?? false),
            title,
            subtitle,
            image,
            startDate,
            endDate
        };

        const updated = await prisma.globalSetting.upsert({
            where: { key: MANDAL_REGISTRATION_KEY },
            update: { value: newSettings },
            create: { key: MANDAL_REGISTRATION_KEY, value: newSettings }
        });

        const val = updated.value as any;
        res.json({
            success: true,
            message: `Mandal registration settings updated successfully`,
            enabled: val.enabled,
            settings: val
        });
    } catch (error) {
        console.error('Error updating mandal registration status:', error);
        res.status(500).json({ success: false, message: 'Error updating mandal registration status' });
    }
};
