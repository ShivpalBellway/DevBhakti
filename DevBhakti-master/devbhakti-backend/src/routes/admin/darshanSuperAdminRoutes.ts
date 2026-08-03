import { Router } from 'express';
import { getAllTickets, getDarshanStats } from '../../controllers/admin/darshanSuperAdminController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/tickets', getAllTickets);
router.get('/stats', getDarshanStats);

export default router;
