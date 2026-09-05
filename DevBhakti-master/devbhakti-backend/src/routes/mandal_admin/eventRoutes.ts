import { Router } from 'express';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';
import * as eventController from '../../controllers/mandal_admin/eventController';

const router = Router();

router.use(authenticate, injectMandalContext);

router.get('/', eventController.getMyEvents);
router.post('/bulk', eventController.createBulkEvents);
router.post('/', eventController.createMyEvent);
router.put('/:id', eventController.updateMyEvent);
router.delete('/:id', eventController.deleteMyEvent);
router.patch('/:id/toggle-status', eventController.toggleEventStatus);

export default router;
