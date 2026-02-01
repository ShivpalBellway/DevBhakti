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

const router = Router();

// Admin Routes
router.post("/", uploadCategoryImage.single('image'), createCategory); // Create Category with image upload
router.get("/", getAllCategories); // Get All Categories (Admin)
router.get("/active", getActiveCategories); // Get Active Categories (for dropdown)
router.get("/:id", getCategoryById); // Get Category by ID
router.put("/:id", uploadCategoryImage.single('image'), updateCategory); // Update Category with image upload
router.delete("/:id", deleteCategory); // Delete Category
router.patch("/:id/status", toggleCategoryStatus); // Toggle Category Status

export default router;
