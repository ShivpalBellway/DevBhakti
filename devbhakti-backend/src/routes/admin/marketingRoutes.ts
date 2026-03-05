import { Router } from 'express';
import { getTargetDevotees, sendBulkWhatsApp } from '../../controllers/admin/marketingController';

const router = Router();

// GET /api/admin/marketing/target-devotees
router.get('/target-devotees', getTargetDevotees);

// POST /api/admin/marketing/send-bulk-whatsapp
router.post('/send-bulk-whatsapp', sendBulkWhatsApp);

export default router;
