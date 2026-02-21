import express from 'express';
import {
    getAllEvents,
    getEventsByTemple,
    createEvent,
    updateEvent,
    deleteEvent
} from '../../controllers/admin/eventController';

import { authenticate, checkPermission } from "../../middleware/authMiddleware";

const router = express.Router();

// Authentication required for all routes
router.use(authenticate);

// Event routes
router.get('/', checkPermission('events.view'), getAllEvents);
router.get('/temple/:templeId', checkPermission('events.view'), getEventsByTemple);
router.post('/', checkPermission('events.create'), createEvent);
router.put('/:id', checkPermission('events.edit'), updateEvent);
router.delete('/:id', checkPermission('events.delete'), deleteEvent);

export default router;
