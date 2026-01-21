import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import * as eventController from '../../controllers/temple_admin/eventController';

const router = Router();

router.use(authenticate);
router.use(authorize('INSTITUTION'));

router.get('/', eventController.getMyEvents);
router.post('/', eventController.createMyEvent);
router.put('/:id', eventController.updateMyEvent);
router.delete('/:id', eventController.deleteMyEvent);
router.patch('/:id/toggle-status', eventController.toggleEventStatus);

export default router;
