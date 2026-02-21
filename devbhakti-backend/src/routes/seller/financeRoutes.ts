import { Router } from "express";
import {
    getSellerLedger,
    getSellerFinanceSummary,
    requestSellerWithdrawal,
    getSellerWithdrawals
} from "../../controllers/seller/financeController";
import { authenticate, checkPermission, injectSellerContext } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate, injectSellerContext);

router.get("/ledger", checkPermission('finance.ledger.view'), getSellerLedger);
router.get("/summary", checkPermission('finance.ledger.view'), getSellerFinanceSummary);
router.post("/withdraw", checkPermission('finance.withdrawals.view'), requestSellerWithdrawal);
router.get("/withdrawals", checkPermission('finance.withdrawals.view'), getSellerWithdrawals);

export default router;
