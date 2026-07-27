import { Router } from 'express';
import {
    getPhotographySettings,
    updatePhotographySettings,
    getMyPackages,
    createMyPackage,
    updateMyPackage,
    deleteMyPackage,
    getMySlots,
    createMySlot,
    updateMySlot,
    deleteMySlot,
    getMyBookings,
    verifyPhotographyTicket,
    deleteMyBooking
} from '../../controllers/temple_admin/photoController';
import { authenticate, injectTempleContext, checkPermission } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(injectTempleContext);
router.use(checkPermission('temple.profile.manage'));

// Settings
router.get('/settings', getPhotographySettings);
router.put('/settings', updatePhotographySettings);

// Packages
router.get('/packages', getMyPackages);
router.post('/packages', createMyPackage);
router.put('/packages/:id', updateMyPackage);
router.delete('/packages/:id', deleteMyPackage);

// Slots
router.get('/slots', getMySlots);
router.post('/slots', createMySlot);
router.put('/slots/:id', updateMySlot);
router.delete('/slots/:id', deleteMySlot);

// Bookings
router.get('/bookings', getMyBookings);
router.post('/verify-ticket', verifyPhotographyTicket);
router.delete('/bookings/:id', deleteMyBooking);

export default router;
