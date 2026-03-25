import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  getAllWithdrawalRequests,
  updateWithdrawalStatus,
  getPlatformFinanceSummary,
  getAllPlatformTransactions,
  downloadTransactionsExcel
} from "../../controllers/admin/financeManagementController";

import { authenticate, checkPermission } from "../../middleware/authMiddleware";

const router = Router();

// Multer setup for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});

import {
  getPendingApprovals,
  approveRequest,
  rejectRequest
} from "../../controllers/admin/adminApprovalsController";

// Authentication required for all finance routes
router.use(authenticate);

router.get("/platform-summary", checkPermission('finance.ledger.view'), getPlatformFinanceSummary);
router.get("/transactions", checkPermission('finance.ledger.view'), getAllPlatformTransactions);
router.get("/export-excel", checkPermission('finance.ledger.view'), downloadTransactionsExcel);

// ... (Multer setup remains same)

router.get("/approvals", checkPermission('finance.ledger.view'), getPendingApprovals);
router.post("/approve", checkPermission('finance.withdrawals.action'), approveRequest);
router.post("/reject", checkPermission('finance.withdrawals.action'), rejectRequest);

router.get("/withdrawals", checkPermission('finance.withdrawals.view'), getAllWithdrawalRequests);
router.patch("/withdrawals/:requestId", checkPermission('finance.withdrawals.action'), upload.single("receiptImage"), updateWithdrawalStatus);

export default router;
