import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductsByTemple,
  getPublicProducts,
  getPublicProductById,
  getProductOwners
} from "../../controllers/admin/productController";
import { uploadProductImage } from "../../middleware/uploadMiddleware";

import { authenticate, checkPermission } from "../../middleware/authMiddleware";

const router = Router();

// Public Routes (No Auth)
router.get("/public", getPublicProducts); // Get Public Products (Landing Page)
router.get("/public/:id", getPublicProductById); // Get Public Product by ID (Landing Page)

// Admin Routes (Auth Required)
router.use(authenticate);

router.post("/", checkPermission('products.create'), uploadProductImage.any(), createProduct); // Create Product with image upload
router.get("/", checkPermission('products.view'), getAllProducts); // Get All Products (Admin)
router.get("/owners", checkPermission('products.view'), getProductOwners); // Get All Product Owners (Temples/Sellers)
router.get("/temple/:templeId", checkPermission('products.view'), getProductsByTemple); // Get Products by Temple
router.get("/:id", checkPermission('products.view'), getProductById); // Get Product by ID
router.put("/:id", checkPermission('products.edit'), uploadProductImage.any(), updateProduct); // Update Product with image upload
router.delete("/:id", checkPermission('products.delete'), deleteProduct); // Delete Product
router.patch("/:id/status", checkPermission('products.edit'), toggleProductStatus); // Toggle Product Status

export default router;
