import { Router } from 'express';
import { updateDarshanSettings, createSlots, getSlots, deleteSlot, updateSlot, getTickets, scanTicket, createOfflineTicket } from '../../controllers/temple_admin/darshanAdminController';
import { authenticate, injectTempleContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate, injectTempleContext);

router.put('/settings', updateDarshanSettings);
router.post('/slots', createSlots);
router.get('/slots', getSlots);
router.delete('/slots/:id', deleteSlot);
router.patch('/slots/:id', updateSlot);
router.get('/tickets', getTickets);
router.post('/scan', scanTicket);
router.post('/offline-ticket', createOfflineTicket);

export default router;
