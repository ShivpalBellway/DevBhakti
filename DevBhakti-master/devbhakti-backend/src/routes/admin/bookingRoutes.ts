import { Router } from 'express';
import { getAllBookings, deleteBookingByAdmin, updateBookingStatus, downloadBookingsExcel, createOfflineBooking, lookupDevoteeByPhone, getOfflinePoojaLeads } from '../../controllers/admin/bookingController';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';
import { uploadProofPhotos } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('bookings.view'), getAllBookings);
router.get('/devotee-lookup', checkPermission('bookings.view'), lookupDevoteeByPhone);
router.get('/offline-leads', checkPermission('bookings.view'), getOfflinePoojaLeads);
router.patch('/:id/status', checkPermission('bookings.manage'), uploadProofPhotos.array('photos', 2), updateBookingStatus);
router.delete('/:id', checkPermission('bookings.manage'), deleteBookingByAdmin);
router.get("/export/excel", downloadBookingsExcel);
router.post('/', checkPermission('bookings.manage'), createOfflineBooking);

export default router;

