import { Router } from 'express';
import { getTellerCatalog, processTellerCheckout, getTellerSummary } from '../../controllers/mandal_admin/tellerCartController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(injectMandalContext);

router.get('/catalog', getTellerCatalog);
router.post('/checkout', processTellerCheckout);
router.get('/summary', getTellerSummary);

export default router;
