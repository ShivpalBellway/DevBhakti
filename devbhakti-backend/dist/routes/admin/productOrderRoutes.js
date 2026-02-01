"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productOrderManagementController_1 = require("../../controllers/admin/productOrderManagementController");
const router = (0, express_1.Router)();
router.get("/", productOrderManagementController_1.getAllOrdersAdmin);
router.patch("/sub-order/:subOrderId", productOrderManagementController_1.updateSubOrderStatusAdmin);
exports.default = router;
