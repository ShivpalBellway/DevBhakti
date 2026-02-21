import { Router } from "express";
import { getAllDonations, getDonationStats, deleteDonation } from "../../controllers/admin/donationController";

const router = Router();

router.get("/", getAllDonations);
router.get("/stats", getDonationStats);
router.delete("/:id", deleteDonation);

export default router;
