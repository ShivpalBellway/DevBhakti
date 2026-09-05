import { Router } from 'express';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';
import * as financeController from '../../controllers/mandal_admin/financeController';

const router = Router();

router.use(authenticate, injectMandalContext);

router.get('/ledger', financeController.getMandalLedger);
router.get('/summary', financeController.getMandalFinanceSummary);
router.get('/report', financeController.getMandalFinancialReport);
router.post('/withdraw', financeController.requestMandalWithdrawal);

export default router;
