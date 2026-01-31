"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productOrderController_1 = require("../../controllers/marketplace/productOrderController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/", productOrderController_1.createOrder);
router.get("/my-orders", authMiddleware_1.authenticate, productOrderController_1.getMyOrders);
router.get("/user/:userId", productOrderController_1.getMyOrders); // Keep for compatibility
router.get("/:id", productOrderController_1.getOrderById);
exports.default = router;
