import { Router } from "express";
import { 
  getTempleLedger, 
  getTempleFinanceSummary, 
  requestWithdrawal 
} from "../../controllers/temple_admin/financeController";

const router = Router();

router.get("/ledger/:templeId", getTempleLedger);
router.get("/summary/:templeId", getTempleFinanceSummary);
router.post("/withdraw", requestWithdrawal);

export default router;
