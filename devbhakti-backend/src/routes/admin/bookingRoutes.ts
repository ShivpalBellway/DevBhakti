import { Router } from 'express';
import { getAllBookings, deleteBookingByAdmin } from '../../controllers/admin/bookingController';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('bookings.view'), getAllBookings);
router.delete('/:id', checkPermission('bookings.manage'), deleteBookingByAdmin);

export default router;
