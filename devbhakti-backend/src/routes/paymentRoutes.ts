import { Router } from "express";
import { verifyPayment, paymentFailed } from "../controllers/paymentController";

const router = Router();

router.post("/verify", verifyPayment);
router.post("/failed", paymentFailed);

export default router;
