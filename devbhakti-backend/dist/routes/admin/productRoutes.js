"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../../controllers/admin/productController");
const uploadMiddleware_1 = require("../../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
// Admin Routes
router.post("/", uploadMiddleware_1.uploadProductImage.single('image'), productController_1.createProduct); // Create Product with image upload
router.get("/", productController_1.getAllProducts); // Get All Products (Admin)
router.get("/public", productController_1.getPublicProducts); // Get Public Products (Landing Page)
router.get("/temple/:templeId", productController_1.getProductsByTemple); // Get Products by Temple
router.get("/:id", productController_1.getProductById); // Get Product by ID
router.put("/:id", uploadMiddleware_1.uploadProductImage.single('image'), productController_1.updateProduct); // Update Product with image upload
router.delete("/:id", productController_1.deleteProduct); // Delete Product
router.patch("/:id/status", productController_1.toggleProductStatus); // Toggle Product Status
exports.default = router;
