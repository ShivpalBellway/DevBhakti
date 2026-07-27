import { Router } from 'express';
import { createPhotographyBooking, getSlotAvailability, getPublicPackages } from '../../controllers/public/photoBookingController';

const router = Router();

router.post('/book', createPhotographyBooking);
router.get('/slots/availability', getSlotAvailability);
router.get('/:templeId/packages', getPublicPackages);

export default router;
