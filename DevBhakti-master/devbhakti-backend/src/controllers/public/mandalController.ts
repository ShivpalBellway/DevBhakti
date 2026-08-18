import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { getLang, localize } from '../../utils/localization';

const router = Router();

// Public: Get all active mandals. Transaction capabilities are enabled only after approval.
router.get('/', async (req, res) => {
    try {
        const lang = req.query.lang as string || getLang({ query: req.query } as any);
        const mandals = await prisma.mandal.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
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
                _count: { select: { donations: true } }
            }
        });
        if (!mandal) {
            res.status(404).json({ success: false, message: 'Mandal not found' });
            return;
        }
        const data = {
            ...mandal,
            poojas: mandal.status === 'APPROVED' ? mandal.poojas : []
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
