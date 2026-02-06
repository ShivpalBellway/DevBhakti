import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderInvoice,
  calculateFees
} from "../../controllers/marketplace/productOrderController";

import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.post("/", authenticate, createOrder);
router.post("/calculate-fees", calculateFees);
router.get("/my-orders", authenticate, getMyOrders);
router.get("/user/:userId", getMyOrders); // Keep for compatibility
router.get("/:id", getOrderById);
router.get("/:id/invoice", getOrderInvoice);

export default router;
