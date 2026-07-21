import { Router } from 'express';
import { getAllBookings, deleteBookingByAdmin, updateBookingStatus, downloadBookingsExcel, createOfflineBooking } from '../../controllers/admin/bookingController';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';
import { uploadProofPhotos } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('bookings.view'), getAllBookings);
router.patch('/:id/status', checkPermission('bookings.manage'), uploadProofPhotos.array('photos', 2), updateBookingStatus);
router.delete('/:id', checkPermission('bookings.manage'), deleteBookingByAdmin);
router.get("/export/excel", downloadBookingsExcel);
router.post('/', checkPermission('bookings.manage'), createOfflineBooking);

export default router;
