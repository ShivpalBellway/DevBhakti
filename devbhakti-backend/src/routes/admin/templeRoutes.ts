import { Router } from 'express';
import { getAllTemples, approveTemple } from '../../controllers/admin/templeController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

// All routes here require ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllTemples);
router.patch('/:id/approve', approveTemple);

export default router;
