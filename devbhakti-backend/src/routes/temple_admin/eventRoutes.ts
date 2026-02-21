import { Router } from 'express';
import { authenticate, authorize, checkPermission, injectTempleContext } from '../../middleware/authMiddleware';
import * as eventController from '../../controllers/temple_admin/eventController';

const router = Router();

router.use(authenticate, injectTempleContext);

router.get('/', checkPermission('events.view'), eventController.getMyEvents);
router.post('/', checkPermission('events.create'), eventController.createMyEvent);
router.put('/:id', checkPermission('events.edit'), eventController.updateMyEvent);
router.delete('/:id', checkPermission('events.delete'), eventController.deleteMyEvent);
router.patch('/:id/toggle-status', checkPermission('events.edit'), eventController.toggleEventStatus);

export default router;
