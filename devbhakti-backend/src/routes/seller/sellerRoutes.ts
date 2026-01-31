import { Router } from "express";
import { getSellerProfile } from "../../controllers/seller/sellerController";
import { authenticate, authorize } from "../../middleware/authMiddleware";

const router = Router();

router.get("/profile", authenticate, authorize('SELLER'), getSellerProfile);

export default router;
