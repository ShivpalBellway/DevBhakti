import { Router } from 'express';
import { createBooking, getMyBookings } from '../../controllers/devotee/bookingController';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/my', getMyBookings);

export default router;
