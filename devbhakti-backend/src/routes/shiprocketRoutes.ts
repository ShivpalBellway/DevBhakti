import { Router } from "express";
import { shiprocketWebhook } from "../controllers/shiprocketWebhookController";

const router = Router();

router.post("/tracking", shiprocketWebhook);

export default router;
