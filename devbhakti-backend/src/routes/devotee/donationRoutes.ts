import { Router } from "express";
import { initiateDonation } from "../../controllers/devotee/donationController";

const router = Router();

router.post("/", initiateDonation);

export default router;
