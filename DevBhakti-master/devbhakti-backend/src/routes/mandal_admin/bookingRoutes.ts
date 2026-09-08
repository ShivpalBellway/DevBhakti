import { Router } from 'express';
import { createOfflineBookingMandal, getMandalBookings, getMandalBookingById, deleteMandalBooking, getMandalOfflinePoojaLeads, lookupDevoteeByPhoneMandal } from '../../controllers/mandal_admin/bookingController';
import { getMandalAvailability, setMandalAvailability } from '../../controllers/mandal_admin/availabilityController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(injectMandalContext);

router.get('/', getMandalBookings);
router.post('/', createOfflineBookingMandal);
router.get('/devotee-lookup', lookupDevoteeByPhoneMandal);
router.get('/offline-leads', getMandalOfflinePoojaLeads);
router.get('/availability', getMandalAvailability);
router.post('/availability', setMandalAvailability);
router.get('/:id', getMandalBookingById);
router.delete('/:id', deleteMandalBooking);

export default router;
