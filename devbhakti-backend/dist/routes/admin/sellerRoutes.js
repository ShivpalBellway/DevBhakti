"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sellerController_1 = require("../../controllers/admin/sellerController");
const router = express_1.default.Router();
router.post('/', sellerController_1.createSeller);
router.get('/', sellerController_1.getAllSellers);
router.get('/:id', sellerController_1.getSellerById);
router.put('/:id', sellerController_1.updateSeller);
router.delete('/:id', sellerController_1.deleteSeller);
router.patch('/:id/status', sellerController_1.toggleSellerStatus);
exports.default = router;
