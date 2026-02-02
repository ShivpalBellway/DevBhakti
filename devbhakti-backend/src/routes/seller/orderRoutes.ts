import { Router } from "express";
import { getSellerOrders, updateSellerOrderStatus, getSellerCustomers } from "../../controllers/seller/orderController";
import { authenticate, authorize } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.use(authorize('SELLER'));

router.get("/", getSellerOrders);
router.get("/customers", getSellerCustomers);
router.patch("/sub-order/:subOrderId", updateSellerOrderStatus);

export default router;
