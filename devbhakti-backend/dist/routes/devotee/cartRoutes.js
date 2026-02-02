"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const cartController_1 = require("../../controllers/devotee/cartController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate); // Require login for all cart operations
router.get("/", cartController_1.getCart);
router.post("/add", cartController_1.addToCart);
router.put("/update", cartController_1.updateCartItem);
router.delete("/remove/:variantId", cartController_1.removeFromCart);
router.delete("/clear", cartController_1.clearCart);
exports.default = router;
