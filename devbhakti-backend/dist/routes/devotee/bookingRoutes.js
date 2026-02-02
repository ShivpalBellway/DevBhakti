"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../../controllers/devotee/bookingController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public Routes
router.get('/check-availability', bookingController_1.checkAvailability);
// Protected Routes
router.use(authMiddleware_1.authenticate);
router.post('/', bookingController_1.createBooking);
router.get('/my', bookingController_1.getMyBookings);
exports.default = router;
