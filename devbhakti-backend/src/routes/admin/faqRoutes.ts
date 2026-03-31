import { Router } from 'express';
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../../controllers/admin/faqController';

const router = Router();

// GET all FAQs (admin - active + inactive)
router.get('/', getFAQs);

// POST create new FAQ
router.post('/', createFAQ);

// PUT update existing FAQ
router.put('/:id', updateFAQ);

// DELETE a FAQ
router.delete('/:id', deleteFAQ);

export default router;
