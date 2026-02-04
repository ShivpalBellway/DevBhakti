"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const templeProductController_1 = require("../../controllers/temple_admin/templeProductController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Multer Config
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (req, file, cb) => {
        cb(null, `product-${Date.now()}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.authorize)('INSTITUTION'));
router.get('/', templeProductController_1.getMyProducts);
router.get('/:id', templeProductController_1.getMyProductById);
router.post('/', upload.any(), templeProductController_1.createProduct);
router.put('/:id', upload.any(), templeProductController_1.updateProduct);
router.delete('/:id', templeProductController_1.deleteProduct);
exports.default = router;
