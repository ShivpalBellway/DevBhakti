import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { getLang, localize } from '../../utils/localization';

const router = Router();

// Public: Get all active mandals filtered by active festival.
router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang as string || getLang({ query: req.query } as any);
        const { mandalType, festival, all } = req.query;

        // Fetch global settings to determine active festival
        const setting = await prisma.globalSetting.findUnique({
            where: { key: 'mandal_registration_enabled' }
        });
        const val = (setting?.value as any) || {};
        const globalEnabled = val.globalEnabled !== undefined ? Boolean(val.globalEnabled) : (val.enabled === true);
        const festivalsList: any[] = Array.isArray(val.festivals) ? val.festivals : [];
        const activeFestival = festivalsList.find((f: any) => f.isActive) || festivalsList[0] || null;

        const whereClause: any = { isActive: true };
        const targetType = (mandalType || festival) as string | undefined;

        if (targetType) {
            whereClause.OR = [
                { mandalType: { contains: targetType, mode: 'insensitive' } },
                { festivals: { contains: targetType, mode: 'insensitive' } }
            ];
        } else if (activeFestival && all !== 'true') {
            const festName = activeFestival.name || activeFestival.title?.en || '';
            const festHi = activeFestival.title?.hi || '';
            const festMr = activeFestival.title?.mr || '';
            const festId = activeFestival.id || '';

            const matchedNames = [festName, festHi, festMr, festId].filter(Boolean);

            const orConditions: any[] = [
                { mandalType: { in: matchedNames } },
                { mandalType: { contains: festName, mode: 'insensitive' } },
                { festivals: { contains: festName, mode: 'insensitive' } },
                { mandalType: null }
            ];

            if (festName.toLowerCase().includes('ganesh')) {
                orConditions.push({ mandalType: { contains: 'Ganesh', mode: 'insensitive' } });
            }
            if (festName.toLowerCase().includes('durga')) {
                orConditions.push({ mandalType: { contains: 'Durga', mode: 'insensitive' } });
            }

            whereClause.OR = orConditions;
        }

        const mandals = await prisma.mandal.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            globalEnabled,
            activeFestival,
            data: lang === 'raw' ? mandals : localize(mandals, lang)
        });
    } catch (error: any) {
        console.error('Get public mandals error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mandals' });
    }
});

// Public: Get mandal by ID or slug
router.get('/:id', async (req, res) => {
    try {
        const id = String(req.params.id);
        const lang = req.query.lang as string || getLang({ query: req.query } as any);
        const mandal = await prisma.mandal.findFirst({
            where: { OR: [{ id }, { slug: id }], isActive: true },
            include: {
                events: { where: { status: true } },
                poojas: { where: { status: true } },
                products: { where: { status: { in: ['approved', 'APPROVED', 'APPROVED_BY_ADMIN', 'active', 'true'] } }, include: { variants: true } },
                _count: { select: { donations: true } }
            }
        });
        if (!mandal) {
            res.status(404).json({ success: false, message: 'Mandal not found' });
            return;
        }
        const data = {
            ...mandal,
            poojas: mandal.status === 'APPROVED' ? mandal.poojas : [],
            products: mandal.status === 'APPROVED' ? mandal.products : []
        };

        res.json({
            success: true,
            data: lang === 'raw' ? data : localize(data, lang)
        });
    } catch (error: any) {
        console.error('Get mandal by id error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mandal' });
    }
});
