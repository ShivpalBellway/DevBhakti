import { Router } from 'express';
import { createBooking, getMyBookings, checkAvailability, getBookingReceipt } from '../../controllers/devotee/bookingController';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/check-availability', checkAvailability);

// Protected Routes
router.use(authenticate);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id/receipt', getBookingReceipt);

export default router;
