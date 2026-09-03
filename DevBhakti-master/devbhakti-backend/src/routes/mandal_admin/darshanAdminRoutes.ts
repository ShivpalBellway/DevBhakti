import { Router } from 'express';
import { createSlots, getSlots, deleteSlot, getTickets, createOfflineTicket } from '../../controllers/mandal_admin/darshanAdminController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate, injectMandalContext);

router.post('/slots', createSlots);
router.get('/slots', getSlots);
router.delete('/slots/:id', deleteSlot);
router.get('/tickets', getTickets);
router.post('/offline-ticket', createOfflineTicket);

export default router;
