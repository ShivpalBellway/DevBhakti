import { Router } from 'express';
import { getTempleBookings, updateBookingStatus, deleteBooking } from '../../controllers/temple_admin/bookingController';
import { setAvailability, getAvailability } from '../../controllers/temple_admin/availabilityController';
import { authenticate, authorize, checkPermission, injectTempleContext } from '../../middleware/authMiddleware';
import { uploadProofPhotos } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate, injectTempleContext);

router.get('/', checkPermission('bookings.view'), getTempleBookings);
router.patch('/:id/status', checkPermission('bookings.manage'), uploadProofPhotos.array('photos', 2), updateBookingStatus);
router.delete('/:id', checkPermission('bookings.manage'), deleteBooking);

// Availability Routes
router.post('/availability', checkPermission('poojas.edit'), setAvailability);
router.get('/availability', checkPermission('poojas.view'), getAvailability);

export default router;
