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

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

// Public: Get all active mandals with optional geolocation filtering
router.get('/', async (req, res) => {
    try {
        const { prisma } = await import('../lib/prisma');
        const { getLang, localize } = await import('../utils/localization');
        const lang = getLang(req);

        const { lat, lng, radius } = req.query;

        const rawMandals = await prisma.mandal.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        let mandals = lang === 'raw' ? rawMandals : localize(rawMandals, lang);

        // If user location is provided, compute distance for each Mandal
        if (lat && lng) {
            const userLat = parseFloat(lat as string);
            const userLng = parseFloat(lng as string);

            if (!isNaN(userLat) && !isNaN(userLng)) {
                mandals = mandals.map((m: any) => {
                    // Use mandal's latitude/longitude or fallback based on area/city for realistic demonstration
                    let mLat = m.latitude;
                    let mLng = m.longitude;

                    if (!mLat || !mLng) {
                        const searchStr = `${m.name} ${m.address} ${m.city}`.toLowerCase();
                        if (searchStr.includes('khetwadi')) {
                            mLat = 18.9568; mLng = 72.8222;
                        } else if (searchStr.includes('lalbaug') || searchStr.includes('parel')) {
                            mLat = 19.0016; mLng = 72.8407;
                        } else if (searchStr.includes('gsb') || searchStr.includes('king')) {
                            mLat = 19.0270; mLng = 72.8550;
                        } else if (searchStr.includes('andheri')) {
                            mLat = 19.1197; mLng = 72.8464;
                        } else {
                            // Default Mumbai baseline coordinates with small random offset per ID
                            const idHash = (m.id || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                            mLat = 19.0760 + ((idHash % 20) - 10) * 0.008;
                            mLng = 72.8777 + ((idHash % 15) - 7) * 0.008;
                        }
                    }

                    const distanceKm = calculateDistanceKm(userLat, userLng, mLat, mLng);
                    return { ...m, distanceKm, latitude: mLat, longitude: mLng };
                });

                // Sort by nearest distance first
                mandals.sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));

                // Filter by radius if provided (e.g., radius=20 km)
                if (radius) {
                    const maxRadius = parseFloat(radius as string);
                    if (!isNaN(maxRadius)) {
                        mandals = mandals.filter((m: any) => m.distanceKm <= maxRadius);
                    }
                }
            }
        }

        res.json({
            success: true,
            data: mandals
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

export default router;
