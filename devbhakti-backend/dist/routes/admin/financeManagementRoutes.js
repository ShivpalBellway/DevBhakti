"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const financeManagementController_1 = require("../../controllers/admin/financeManagementController");
const router = (0, express_1.Router)();
router.get("/platform-summary", financeManagementController_1.getPlatformFinanceSummary);
router.get("/transactions", financeManagementController_1.getAllPlatformTransactions);
// Multer setup for receipt uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `receipt-${Date.now()}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({ storage });
router.get("/withdrawals", financeManagementController_1.getAllWithdrawalRequests);
router.patch("/withdrawals/:requestId", upload.single("receiptImage"), financeManagementController_1.updateWithdrawalStatus);
exports.default = router;
