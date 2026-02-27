import { Router } from "express";
import { getAllDonations, getDonationStats, deleteDonation, downloadDonationsExcel } from "../../controllers/admin/donationController";

const router = Router();

router.get("/", getAllDonations);
router.get("/stats", getDonationStats);
router.delete("/:id", deleteDonation);
router.get("/export/excel", downloadDonationsExcel);
export default router;
