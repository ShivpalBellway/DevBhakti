import { Router } from 'express';
import { getSlots, bookDarshan, getMyTickets, getTicketDetail } from '../../controllers/devotee/darshanController';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Devotee endpoints - user must be logged in for booking and viewing tickets
router.get('/slots/:templeId', getSlots); // Get slots doesn't technically need auth, but it's okay here or can be moved out
router.post('/book', authenticate, bookDarshan);
router.get('/my-tickets', authenticate, getMyTickets);
router.get('/ticket/:id', authenticate, getTicketDetail);

export default router;
