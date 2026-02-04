import { Router } from 'express';
import { createBooking, getMyBookings, checkAvailability, getBookingReceipt, getUnavailableDates } from '../../controllers/devotee/bookingController';
import { calculateCommission } from '../../controllers/admin/commissionSlabController';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/check-availability', checkAvailability);
router.post('/calculate-commission', calculateCommission); // New public route for checkout
router.get('/unavailable-dates', getUnavailableDates);

// Protected Routes
router.use(authenticate);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id/receipt', getBookingReceipt);

export default router;
