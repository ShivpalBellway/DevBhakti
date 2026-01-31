import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from "../../controllers/devotee/cartController";

const router = Router();

router.use(authenticate); // Require login for all cart operations

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/remove/:variantId", removeFromCart);
router.delete("/clear", clearCart);

export default router;
