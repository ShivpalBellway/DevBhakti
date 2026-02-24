import { Router } from "express";
import {
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from "../../controllers/admin/categoryController";
import { uploadCategoryImage } from "../../middleware/uploadMiddleware";

import { authenticate, checkPermission } from "../../middleware/authMiddleware";

const router = Router();

// Public Routes
router.get("/active", getActiveCategories); // Get Active Categories (Public for Marketplace)

// Authentication is required for all other routes
router.use(authenticate);

// Admin Routes
router.post("/", checkPermission('categories.create'), uploadCategoryImage.single('image'), createCategory); // Create Category with image upload
router.get("/", checkPermission('categories.view'), getAllCategories); // Get All Categories (Admin)
router.get("/:id", checkPermission('categories.view'), getCategoryById); // Get Category by ID
router.put("/:id", checkPermission('categories.edit'), uploadCategoryImage.single('image'), updateCategory); // Update Category with image upload
router.delete("/:id", checkPermission('categories.delete'), deleteCategory); // Delete Category
router.patch("/:id/status", checkPermission('categories.edit'), toggleCategoryStatus); // Toggle Category Status

export default router;
