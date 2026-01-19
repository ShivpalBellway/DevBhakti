import express from 'express';
import {
    getAllEvents,
    getEventsByTemple,
    createEvent,
    updateEvent,
    deleteEvent
} from '../../controllers/admin/eventController';

const router = express.Router();

// Event routes
router.get('/', getAllEvents);
router.get('/temple/:templeId', getEventsByTemple);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
