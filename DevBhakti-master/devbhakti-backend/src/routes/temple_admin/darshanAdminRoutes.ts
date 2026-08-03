import { Router } from 'express';
import { updateDarshanSettings, createSlots, getSlots, deleteSlot, getTickets, scanTicket } from '../../controllers/temple_admin/darshanAdminController';
import { authenticate, injectTempleContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate, injectTempleContext);

router.put('/settings', updateDarshanSettings);
router.post('/slots', createSlots);
router.get('/slots', getSlots);
router.delete('/slots/:id', deleteSlot);
router.get('/tickets', getTickets);
router.post('/scan', scanTicket);

export default router;
