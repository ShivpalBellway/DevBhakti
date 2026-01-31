"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../../controllers/admin/categoryController");
const uploadMiddleware_1 = require("../../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
// Admin Routes
router.post("/", uploadMiddleware_1.uploadCategoryImage.single('image'), categoryController_1.createCategory); // Create Category with image upload
router.get("/", categoryController_1.getAllCategories); // Get All Categories (Admin)
router.get("/active", categoryController_1.getActiveCategories); // Get Active Categories (for dropdown)
router.get("/:id", categoryController_1.getCategoryById); // Get Category by ID
router.put("/:id", uploadMiddleware_1.uploadCategoryImage.single('image'), categoryController_1.updateCategory); // Update Category with image upload
router.delete("/:id", categoryController_1.deleteCategory); // Delete Category
router.patch("/:id/status", categoryController_1.toggleCategoryStatus); // Toggle Category Status
exports.default = router;
