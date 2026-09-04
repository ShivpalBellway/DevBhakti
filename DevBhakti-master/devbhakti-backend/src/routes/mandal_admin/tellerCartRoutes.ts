import { Router } from 'express';
import { getTellerCatalog, processTellerCheckout, getTellerSummary, getTellerOrders, getTellerProductOrders } from '../../controllers/mandal_admin/tellerCartController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(injectMandalContext);

router.get('/catalog', getTellerCatalog);
router.post('/checkout', processTellerCheckout);
router.get('/summary', getTellerSummary);
router.get('/orders', getTellerOrders);
router.get('/product-orders', getTellerProductOrders);

export default router;
