import { Router } from "express";
import { initiateDonation, getDonationReceipt, getMyDonations } from "../../controllers/devotee/donationController";
import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

// Public routes (if any)
router.post("/", initiateDonation);

// Protected routes
router.use(authenticate);
router.get("/my", getMyDonations);
router.get("/:id/receipt", getDonationReceipt);

export default router;
