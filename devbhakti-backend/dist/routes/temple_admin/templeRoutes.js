"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const templeController_1 = require("../../controllers/temple_admin/templeController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Multer Config
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temples/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
const registrationUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 10 }
]);
router.post('/register', registrationUpload, templeController_1.registerTemple);
router.get('/profile', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)('INSTITUTION'), templeController_1.getMyTempleProfile);
router.put('/profile', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)('INSTITUTION'), registrationUpload, templeController_1.updateMyTempleProfile);
exports.default = router;
