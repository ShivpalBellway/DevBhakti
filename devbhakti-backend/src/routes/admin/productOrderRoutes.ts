import { Router } from "express";
import {
  getAllOrdersAdmin,
  updateSubOrderStatusAdmin,
  downloadOrdersExcelAdmin
} from "../../controllers/admin/productOrderManagementController";

import { authenticate, checkPermission } from "../../middleware/authMiddleware";

const router = Router();

// Authentication required
router.use(authenticate);

router.get("/export/excel", checkPermission('products.orders.view'), downloadOrdersExcelAdmin);
router.get("/", checkPermission('products.orders.view'), getAllOrdersAdmin);
router.patch("/sub-order/:subOrderId", checkPermission('products.orders.manage'), updateSubOrderStatusAdmin);

export default router;
