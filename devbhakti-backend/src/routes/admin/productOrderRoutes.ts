import { Router } from "express";
import { 
  getAllOrdersAdmin, 
  updateSubOrderStatusAdmin 
} from "../../controllers/admin/productOrderManagementController";

const router = Router();

router.get("/", getAllOrdersAdmin);
router.patch("/sub-order/:subOrderId", updateSubOrderStatusAdmin);

export default router;
