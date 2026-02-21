import { Router } from "express";
import { getSellerOrders, updateSellerOrderStatus, getSellerCustomers } from "../../controllers/seller/orderController";
import { authenticate, checkPermission, injectSellerContext } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate, injectSellerContext);

router.get("/", checkPermission('products.orders.view'), getSellerOrders);
router.get("/customers", checkPermission('products.orders.view'), getSellerCustomers);
router.patch("/sub-order/:subOrderId", checkPermission('products.orders.manage'), updateSellerOrderStatus);

export default router;
