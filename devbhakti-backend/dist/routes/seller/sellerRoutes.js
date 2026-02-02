"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sellerController_1 = require("../../controllers/seller/sellerController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (req, file, cb) => {
        cb(null, `seller-profile-${Date.now()}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
router.get("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)('SELLER'), sellerController_1.getSellerProfile);
router.put("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)('SELLER'), upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 5 }
]), sellerController_1.updateSellerProfile);
exports.default = router;
