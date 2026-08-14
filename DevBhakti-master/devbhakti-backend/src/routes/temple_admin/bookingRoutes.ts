import { Router } from 'express';
import { getTempleBookings, updateBookingStatus, deleteBooking, createOfflineBookingTemple, getTempleOfflinePoojaLeads } from '../../controllers/temple_admin/bookingController';
import { lookupDevoteeByPhone } from '../../controllers/admin/bookingController';
import { setAvailability, getAvailability } from '../../controllers/temple_admin/availabilityController';
import { authenticate, authorize, checkPermission, injectTempleContext } from '../../middleware/authMiddleware';
import { uploadProofPhotos } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate, injectTempleContext);

router.get('/', checkPermission('bookings.view'), getTempleBookings);
router.get('/devotee-lookup', checkPermission('bookings.view'), lookupDevoteeByPhone);
router.get('/offline-leads', checkPermission('bookings.view'), getTempleOfflinePoojaLeads);
router.patch('/:id/status', checkPermission('bookings.manage'), uploadProofPhotos.array('photos', 2), updateBookingStatus);
router.delete('/:id', checkPermission('bookings.manage'), deleteBooking);
router.post('/', checkPermission('bookings.manage'), createOfflineBookingTemple);

// Availability Routes
router.post('/availability', checkPermission('poojas.edit'), setAvailability);
router.get('/availability', checkPermission('poojas.view'), getAvailability);

export default router;

