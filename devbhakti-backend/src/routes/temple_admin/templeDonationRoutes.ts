import { Router } from "express";
import { getTempleDonations, getTempleDonationStats } from "../../controllers/temple_admin/templeDonationController";

const router = Router();

router.get("/:templeId", getTempleDonations);
router.get("/:templeId/stats", getTempleDonationStats);

export default router;
