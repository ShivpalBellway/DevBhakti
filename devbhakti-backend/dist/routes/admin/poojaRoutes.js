"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const poojaController_1 = require("../../controllers/admin/poojaController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const uploadMiddleware_1 = require("../../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
// All routes here require ADMIN role
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.authorize)('ADMIN'));
router.get('/', poojaController_1.getAllPoojas);
router.post('/', uploadMiddleware_1.uploadPoojaImage.single('image'), poojaController_1.createPooja);
router.put('/:id', uploadMiddleware_1.uploadPoojaImage.single('image'), poojaController_1.updatePooja);
router.delete('/:id', poojaController_1.deletePooja);
exports.default = router;
