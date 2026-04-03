import { Router } from 'express';
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../../controllers/admin/faqController';
import { authenticate, checkPermission } from '../../middleware/authMiddleware';

const router = Router();

// Auth required for all admin FAQ operations
router.use(authenticate);

// GET all FAQs (admin - active + inactive)
router.get('/', checkPermission('faqs.view'), getFAQs);

// POST create new FAQ
router.post('/', checkPermission('faqs.create'), createFAQ);

// PUT update existing FAQ
router.put('/:id', checkPermission('faqs.edit'), updateFAQ);

// DELETE a FAQ
router.delete('/:id', checkPermission('faqs.delete'), deleteFAQ);

export default router;
