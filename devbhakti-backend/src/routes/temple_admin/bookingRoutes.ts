import { Router } from 'express';
import { getTempleBookings, updateBookingStatus, deleteBooking } from '../../controllers/temple_admin/bookingController';
import { setAvailability, getAvailability } from '../../controllers/temple_admin/availabilityController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize('INSTITUTION'));

router.get('/', getTempleBookings);
router.patch('/:id/status', updateBookingStatus);
router.delete('/:id', deleteBooking);

// Availability Routes
router.post('/availability', setAvailability);
router.get('/availability', getAvailability);

export default router;
