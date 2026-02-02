"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController_1 = require("../../controllers/admin/dashboardController");
const router = express_1.default.Router();
// Get Dashboard Stats
router.get('/stats', dashboardController_1.getAdminDashboardStats);
exports.default = router;
