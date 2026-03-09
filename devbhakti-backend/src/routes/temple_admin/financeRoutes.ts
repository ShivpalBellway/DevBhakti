import { Router } from "express";
import {
  getTempleLedger,
  getTempleFinanceSummary,
  requestWithdrawal
} from "../../controllers/temple_admin/financeController";

import { authenticate, checkPermission } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate);

router.get("/ledger/:templeId", checkPermission('finance.ledger.view'), getTempleLedger);
router.get("/summary/:templeId", checkPermission('finance.ledger.view'), getTempleFinanceSummary);
router.post("/withdraw", checkPermission('finance.withdrawals.view'), requestWithdrawal);

export default router;
