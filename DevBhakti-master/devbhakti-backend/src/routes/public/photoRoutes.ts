import { Router } from 'express';
import { createPhotographyBooking, getSlotAvailability } from '../../controllers/public/photoBookingController';

const router = Router();

router.post('/book', createPhotographyBooking);
router.get('/slots/availability', getSlotAvailability);

export default router;
