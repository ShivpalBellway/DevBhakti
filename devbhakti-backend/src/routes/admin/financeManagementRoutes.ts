import { Router } from "express";
import multer from "multer";
import path from "path";
import { 
  getAllWithdrawalRequests, 
  updateWithdrawalStatus,
  getPlatformFinanceSummary
} from "../../controllers/admin/financeManagementController";

const router = Router();

router.get("/platform-summary", getPlatformFinanceSummary);

// Multer setup for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

router.get("/withdrawals", getAllWithdrawalRequests);
router.patch("/withdrawals/:requestId", upload.single("receiptImage"), updateWithdrawalStatus);

export default router;
