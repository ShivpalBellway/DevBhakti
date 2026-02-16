import { Router } from 'express';
import { getTempleDevotees } from '../../controllers/temple_admin/templeController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, authorize('INSTITUTION'), getTempleDevotees);

export default router;
