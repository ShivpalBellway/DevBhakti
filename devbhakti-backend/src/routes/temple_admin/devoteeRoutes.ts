import { Router } from 'express';
import { getTempleDevotees, getDevoteeDetail, downloadDevoteesExcel } from '../../controllers/temple_admin/templeController';
import { authenticate, authorize, injectTempleContext } from '../../middleware/authMiddleware';

const router = Router();

router.get('/export/excel', authenticate, authorize('INSTITUTION'), injectTempleContext, downloadDevoteesExcel);
router.get('/', authenticate, authorize('INSTITUTION'), injectTempleContext, getTempleDevotees);
router.get('/:id', authenticate, authorize('INSTITUTION'), injectTempleContext, getDevoteeDetail);

export default router;
