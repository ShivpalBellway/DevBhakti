import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  getAllWithdrawalRequests,
  updateWithdrawalStatus,
  getPlatformFinanceSummary,
  getAllPlatformTransactions
} from "../../controllers/admin/financeManagementController";

const router = Router();

router.get("/platform-summary", getPlatformFinanceSummary);
router.get("/transactions", getAllPlatformTransactions);

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

router.get("/approvals", getPendingApprovals);
router.post("/approve", approveRequest);
router.post("/reject", rejectRequest);

router.get("/withdrawals", getAllWithdrawalRequests);
router.patch("/withdrawals/:requestId", upload.single("receiptImage"), updateWithdrawalStatus);

export default router;
