import { Router } from 'express';
import { createBooking, getMyBookings, checkAvailability } from '../../controllers/devotee/bookingController';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/check-availability', checkAvailability);

// Protected Routes
router.use(authenticate);

router.post('/', createBooking);
router.get('/my', getMyBookings);

export default router;
