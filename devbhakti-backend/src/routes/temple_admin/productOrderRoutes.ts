import { Router } from "express";
import { 
  getTempleOrders, 
  updateTempleOrderStatus 
} from "../../controllers/temple_admin/templeOrderController";

const router = Router();

router.get("/:templeId", getTempleOrders);
router.patch("/sub-order/:subOrderId", updateTempleOrderStatus);

export default router;
