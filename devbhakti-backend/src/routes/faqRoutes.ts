import { Router } from 'express';
import { getActiveFAQs } from '../controllers/admin/faqController';

const router = Router();

// GET active FAQs only (public - used on pooja detail pages)
router.get('/', getActiveFAQs);

export default router;
