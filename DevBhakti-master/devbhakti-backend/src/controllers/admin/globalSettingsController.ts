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

// ─── Mandal Registration & Multi-Festival Control ───────────────────────────────────

// PUBLIC & ADMIN: Fetch mandal registration settings
export const getMandalRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const setting = await prisma.globalSetting.findUnique({
            where: { key: MANDAL_REGISTRATION_KEY }
        });
        const val = (setting?.value as any) || {};

        const globalEnabled = val.globalEnabled !== undefined ? Boolean(val.globalEnabled) : (val.enabled === true);
        const festivals: any[] = Array.isArray(val.festivals) ? val.festivals : [];

        // If legacy single festival format exists and festivals array is empty, convert legacy format
        if (festivals.length === 0 && (val.title || val.image || val.startDate)) {
            festivals.push({
                id: 'fest_default',
                name: val.title?.en || 'Ganesh Utsav Registration',
                title: val.title || { en: '', hi: '', mr: '' },
                subtitle: val.subtitle || { en: '', hi: '', mr: '' },
                image: val.image || '',
                startDate: val.startDate || '',
                endDate: val.endDate || '',
                isActive: val.enabled === true
            });
        }

        let activeFestival = festivals.find((f: any) => f.isActive) || festivals[0] || null;

        // Effective overall enabled state for public registration
        const isRegistrationOpen = globalEnabled && !!activeFestival && activeFestival.isActive;

        res.json({
            success: true,
            globalEnabled,
            enabled: isRegistrationOpen, // Public convenience flag
            activeFestival,
            festivals,
            // Fallback backward compatibility fields
            title: activeFestival?.title || { en: '', hi: '', mr: '' },
            subtitle: activeFestival?.subtitle || { en: '', hi: '', mr: '' },
            image: activeFestival?.image || '',
            startDate: activeFestival?.startDate || '',
            endDate: activeFestival?.endDate || ''
        });
    } catch (error) {
        console.error('Error fetching mandal registration status:', error);
        res.status(500).json({ success: false, message: 'Error fetching mandal registration status' });
    }
};

// ADMIN: Update global toggle or festival list (add, edit, delete, activate)
export const updateMandalRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const existing = await prisma.globalSetting.findUnique({
            where: { key: MANDAL_REGISTRATION_KEY }
        });
        const prevVal = (existing?.value as any) || {};

        let globalEnabled = prevVal.globalEnabled !== undefined ? Boolean(prevVal.globalEnabled) : (prevVal.enabled ?? false);
        if (req.body.globalEnabled !== undefined) {
            globalEnabled = req.body.globalEnabled === true || req.body.globalEnabled === 'true';
        } else if (req.body.enabled !== undefined && req.body.action === 'toggleGlobal') {
            globalEnabled = req.body.enabled === true || req.body.enabled === 'true';
        }

        let festivals: any[] = Array.isArray(prevVal.festivals) ? [...prevVal.festivals] : [];
        if (festivals.length === 0 && (prevVal.title || prevVal.image || prevVal.startDate)) {
            festivals.push({
                id: 'fest_default',
                name: prevVal.title?.en || 'Ganesh Utsav Registration',
                title: prevVal.title || { en: '', hi: '', mr: '' },
                subtitle: prevVal.subtitle || { en: '', hi: '', mr: '' },
                image: prevVal.image || '',
                startDate: prevVal.startDate || '',
                endDate: prevVal.endDate || '',
                isActive: true
            });
        }

        const action = req.body.action || 'saveFestival';

        if (action === 'toggleGlobal') {
            // Only toggles the master global switch
        } else if (action === 'activateFestival') {
            const festivalId = req.body.festivalId;
            festivals = festivals.map((f) => ({
                ...f,
                isActive: f.id === festivalId
            }));
        } else if (action === 'deleteFestival') {
            const festivalId = req.body.festivalId;
            festivals = festivals.filter((f) => f.id !== festivalId);
            if (festivals.length > 0 && !festivals.some((f) => f.isActive)) {
                festivals[0].isActive = true;
            }
        } else if (action === 'saveFestival') {
            const festivalId = req.body.id || `fest_${Date.now()}`;
            
            let title = req.body.title;
            if (typeof title === 'string') {
                try { title = JSON.parse(title); } catch (e) { title = undefined; }
            }
            if (!title || typeof title !== 'object') {
                title = {
                    en: req.body.title_en ?? req.body['title.en'] ?? '',
                    hi: req.body.title_hi ?? req.body['title.hi'] ?? '',
                    mr: req.body.title_mr ?? req.body['title.mr'] ?? ''
                };
            }

            let subtitle = req.body.subtitle;
            if (typeof subtitle === 'string') {
                try { subtitle = JSON.parse(subtitle); } catch (e) { subtitle = undefined; }
            }
            if (!subtitle || typeof subtitle !== 'object') {
                subtitle = {
                    en: req.body.subtitle_en ?? req.body['subtitle.en'] ?? '',
                    hi: req.body.subtitle_hi ?? req.body['subtitle.hi'] ?? '',
                    mr: req.body.subtitle_mr ?? req.body['subtitle.mr'] ?? ''
                };
            }

            let image = req.body.existingImage || '';
            if (req.file) {
                image = `/uploads/cms/mandal/${req.file.filename}`;
            } else if (req.body.image && typeof req.body.image === 'string') {
                image = req.body.image;
            }

            let isActive = req.body.isActive === true || req.body.isActive === 'true';

            const existingIndex = festivals.findIndex((f) => f.id === festivalId);

            if (isActive) {
                festivals = festivals.map((f) => ({ ...f, isActive: false }));
            } else if (festivals.length === 0 || existingIndex === -1 && !festivals.some((f) => f.isActive)) {
                isActive = true;
            }

            const festivalItem = {
                id: festivalId,
                name: req.body.name || title.en || 'Festival Registration',
                title,
                subtitle,
                image,
                startDate: req.body.startDate || '',
                endDate: req.body.endDate || '',
                isActive
            };

            if (existingIndex >= 0) {
                festivals[existingIndex] = festivalItem;
            } else {
                festivals.push(festivalItem);
            }
        }

        const activeFestival = festivals.find((f) => f.isActive) || festivals[0] || null;

        const newSettings = {
            globalEnabled,
            enabled: globalEnabled && !!activeFestival && activeFestival.isActive,
            activeFestivalId: activeFestival?.id || null,
            festivals,
            // Mirror active festival properties for legacy frontend consumers
            title: activeFestival?.title || { en: '', hi: '', mr: '' },
            subtitle: activeFestival?.subtitle || { en: '', hi: '', mr: '' },
            image: activeFestival?.image || '',
            startDate: activeFestival?.startDate || '',
            endDate: activeFestival?.endDate || ''
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
            globalEnabled: val.globalEnabled,
            enabled: val.enabled,
            settings: val
        });
    } catch (error) {
        console.error('Error updating mandal registration status:', error);
        res.status(500).json({ success: false, message: 'Error updating mandal registration status' });
    }
};
