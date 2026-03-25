import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

const RATINGS_SETTINGS_KEY = 'ratings_management';

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
