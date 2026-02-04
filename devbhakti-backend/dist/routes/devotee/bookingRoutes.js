"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../../controllers/devotee/bookingController");
const commissionSlabController_1 = require("../../controllers/admin/commissionSlabController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public Routes
router.get('/check-availability', bookingController_1.checkAvailability);
router.post('/calculate-commission', commissionSlabController_1.calculateCommission); // New public route for checkout
router.get('/unavailable-dates', bookingController_1.getUnavailableDates);
// Protected Routes
router.use(authMiddleware_1.authenticate);
router.post('/', bookingController_1.createBooking);
router.get('/my', bookingController_1.getMyBookings);
router.get('/:id/receipt', bookingController_1.getBookingReceipt);
exports.default = router;
