import { Router } from "express";
import { 
  getMandalOrders, 
  updateMandalOrderStatus,
  createOfflineMandalOrder
} from "../../controllers/mandal_admin/orderController";
import { authenticate, injectMandalContext } from "../../middleware/authMiddleware";

const router = Router();

router.get("/:mandalId", getMandalOrders);
router.post("/offline", authenticate, injectMandalContext, createOfflineMandalOrder);
router.patch("/sub-order/:subOrderId", updateMandalOrderStatus);

export default router;

