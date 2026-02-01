import { Router } from "express";
import { getSellerOrders, updateSellerOrderStatus } from "../../controllers/seller/orderController";
import { authenticate, authorize } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.use(authorize('SELLER'));

router.get("/", getSellerOrders);
router.patch("/sub-order/:subOrderId", updateSellerOrderStatus);

export default router;
