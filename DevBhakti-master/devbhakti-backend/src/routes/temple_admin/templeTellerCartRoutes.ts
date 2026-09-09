import { Router } from 'express';
import {
  getTempleTellerCatalog,
  processTempleTellerCheckout,
  getTempleTellerSummary,
  getTempleTellerOrders,
  calculateTempleCartCommission,
} from '../../controllers/temple_admin/templeTellerCartController';
import { authenticate, injectTempleContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(injectTempleContext);

router.get('/catalog', getTempleTellerCatalog);
router.post('/calculate-commission', calculateTempleCartCommission);
router.post('/checkout', processTempleTellerCheckout);
router.get('/summary', getTempleTellerSummary);
router.get('/orders', getTempleTellerOrders);

export default router;
