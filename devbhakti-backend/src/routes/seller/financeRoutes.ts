import { Router } from "express";
import {
    getSellerLedger,
    getSellerFinanceSummary,
    requestSellerWithdrawal,
    getSellerWithdrawals
} from "../../controllers/seller/financeController";
import { authenticate, authorize } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.use(authorize('SELLER'));

router.get("/ledger", getSellerLedger);
router.get("/summary", getSellerFinanceSummary);
router.post("/withdraw", requestSellerWithdrawal);
router.get("/withdrawals", getSellerWithdrawals);

export default router;
