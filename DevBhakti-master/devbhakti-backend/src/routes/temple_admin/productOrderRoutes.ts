import { Router } from "express";
import { 
  getTempleOrders, 
  updateTempleOrderStatus,
  createOfflineTempleOrder
} from "../../controllers/temple_admin/templeOrderController";
import { authenticate, injectTempleContext } from "../../middleware/authMiddleware";

const router = Router();

router.get("/:templeId", getTempleOrders);
router.post("/offline", authenticate, injectTempleContext, createOfflineTempleOrder);
router.patch("/sub-order/:subOrderId", updateTempleOrderStatus);

export default router;
