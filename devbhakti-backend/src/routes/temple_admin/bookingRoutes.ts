import { Router } from 'express';
import { getTempleBookings, updateBookingStatus, deleteBooking } from '../../controllers/temple_admin/bookingController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize('INSTITUTION'));

router.get('/', getTempleBookings);
router.patch('/:id/status', updateBookingStatus);
router.delete('/:id', deleteBooking);

export default router;
