import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductsByTemple,
  getPublicProducts
} from "../../controllers/admin/productController";
import { uploadProductImage } from "../../middleware/uploadMiddleware";

const router = Router();

// Admin Routes
router.post("/", uploadProductImage.single('image'), createProduct); // Create Product with image upload
router.get("/", getAllProducts); // Get All Products (Admin)
router.get("/public", getPublicProducts); // Get Public Products (Landing Page)
router.get("/temple/:templeId", getProductsByTemple); // Get Products by Temple
router.get("/:id", getProductById); // Get Product by ID
router.put("/:id", uploadProductImage.single('image'), updateProduct); // Update Product with image upload
router.delete("/:id", deleteProduct); // Delete Product
router.patch("/:id/status", toggleProductStatus); // Toggle Product Status

export default router;
