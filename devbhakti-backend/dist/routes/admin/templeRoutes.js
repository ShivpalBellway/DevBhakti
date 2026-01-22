"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const templeController_1 = require("../../controllers/admin/templeController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = express_1.default.Router();
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
// Routes with multiple file fields
const templeUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 10 }
]);
// All routes here require ADMIN role
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.authorize)('ADMIN'));
router.get('/', templeController_1.getAllTemples);
router.post('/', templeUpload, templeController_1.createTemple);
router.put('/:id', templeUpload, templeController_1.updateTemple);
router.patch('/:id/status', templeController_1.toggleTempleStatus);
router.delete('/:id', templeController_1.deleteTemple);
exports.default = router;
