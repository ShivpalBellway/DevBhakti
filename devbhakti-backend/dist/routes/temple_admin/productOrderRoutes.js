"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const templeOrderController_1 = require("../../controllers/temple_admin/templeOrderController");
const router = (0, express_1.Router)();
router.get("/:templeId", templeOrderController_1.getTempleOrders);
router.patch("/sub-order/:subOrderId", templeOrderController_1.updateTempleOrderStatus);
exports.default = router;
