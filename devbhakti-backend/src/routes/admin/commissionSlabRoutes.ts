import express from 'express';
import {
  getAllSlabs,
  createSlab,
  updateSlab,
  deleteSlab,
  calculateCommission
} from '../../controllers/admin/commissionSlabController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all slabs (with optional filters)
router.get('/', getAllSlabs);

// Create new slab
router.post('/', createSlab);

// Update slab
router.put('/:id', updateSlab);

// Delete slab (soft delete)
router.delete('/:id', deleteSlab);

// Calculate commission for testing
router.post('/calculate', calculateCommission);

export default router;
