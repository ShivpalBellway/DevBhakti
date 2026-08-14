import { Router } from 'express';
import multer from 'multer';

const router = Router();

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/mandals/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Public route to submit a new Mandal Registration
router.post('/register', (upload as any).fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 5 },
    { name: 'documentUrl', maxCount: 5 }
]), async (req, res) => {
    try {
        const files = req.files as any;
        const data = req.body;

        const { prisma } = await import('../lib/prisma');

        // Extract image paths
        const image = files?.image?.[0] ? `/uploads/mandals/${files.image[0].filename}` : data.image;
        const heroImages = files?.heroImages?.map((f: any) => `/uploads/mandals/${f.filename}`) || [];

        const mandal = await prisma.mandal.create({
            data: {
                name: JSON.stringify({
                    en: data.name_en || data.name || '',
                    hi: data.name_hi || '',
                    mr: data.name_mr || ''
                }),
                description: JSON.stringify({
                    en: data.description_en || data.description || '',
                    hi: data.description_hi || '',
                    mr: data.description_mr || ''
                }),
                mandalType: data.mandalType || undefined,
                presiding_deity: data.presiding_deity || undefined,
                festivals: data.festivals || undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                pinCode: data.pinCode || undefined,
                contactNumber: data.contactNumber,
                email: data.email || undefined,
                presidentName: data.presidentName || undefined,
                registrationNumber: data.registrationNumber || undefined,
                documentUrl: files?.documentUrl ? (files.documentUrl as any[]).map((f: any) => `/uploads/mandals/${f.filename}`) : undefined,
                image: image || undefined,
                bannerImages: heroImages,
                status: 'PENDING'
            }
        });

        res.status(201).json({ success: true, message: 'Mandal registered successfully', data: mandal });
    } catch (error: any) {
        console.error('Mandal registration error:', error);
        res.status(500).json({ success: false, message: 'Failed to register mandal', error: error.message });
    }
});

// Public: Get all approved mandals
router.get('/', async (req, res) => {
    try {
        const { prisma } = await import('../lib/prisma');
        

        const { getLang, localize } = await import('../utils/localization');
        const lang = getLang(req);
        
        const mandals = await prisma.mandal.findMany({
            where: { isActive: true, status: 'APPROVED' },
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
        const { prisma } = await import('../lib/prisma');
        const { getLang, localize } = await import('../utils/localization');
        const id = String(req.params.id);
        const lang = getLang(req);
        
        const mandal = await prisma.mandal.findFirst({
            where: { OR: [{ id }, { slug: id }], isActive: true, status: 'APPROVED' },
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
        res.json({
            success: true,
            data: lang === 'raw' ? mandal : localize(mandal, lang)
        });
    } catch (error: any) {
        console.error('Get mandal by id error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mandal' });
    }
});

export default router;