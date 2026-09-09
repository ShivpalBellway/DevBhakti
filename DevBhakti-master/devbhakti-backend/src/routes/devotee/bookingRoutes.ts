import { Router } from 'express';
import { createBooking, getMyBookings, checkAvailability, getBookingReceipt, getUnavailableDates, getPrasadTracking, trackByAwb } from '../../controllers/devotee/bookingController';
import { calculateCommission } from '../../controllers/admin/commissionSlabController';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/check-availability', checkAvailability);
router.post('/calculate-commission', calculateCommission);
router.get('/calculate-commission', calculateCommission);
router.get('/unavailable-dates', getUnavailableDates);
router.get('/track-awb', trackByAwb); // Public: track by AWB code (no login needed)

// Protected Routes
router.use(authenticate);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id/receipt', getBookingReceipt);
router.get('/:id/prasad-tracking', getPrasadTracking);

export default router;
