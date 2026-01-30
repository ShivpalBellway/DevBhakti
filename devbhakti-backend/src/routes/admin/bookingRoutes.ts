import { Router } from 'express';
import { getAllBookings, deleteBookingByAdmin } from '../../controllers/admin/bookingController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllBookings);
router.delete('/:id', deleteBookingByAdmin);

export default router;
