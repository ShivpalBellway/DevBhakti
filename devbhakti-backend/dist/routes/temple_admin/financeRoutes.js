"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financeController_1 = require("../../controllers/temple_admin/financeController");
const router = (0, express_1.Router)();
router.get("/ledger/:templeId", financeController_1.getTempleLedger);
router.get("/summary/:templeId", financeController_1.getTempleFinanceSummary);
router.post("/withdraw", financeController_1.requestWithdrawal);
exports.default = router;
