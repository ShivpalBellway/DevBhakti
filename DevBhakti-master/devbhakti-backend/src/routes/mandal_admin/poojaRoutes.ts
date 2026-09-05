import { Router } from 'express';
import * as poojaController from '../../controllers/mandal_admin/poojaController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';
import { uploadPoojaImage } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);
router.use(injectMandalContext);

router.get('/', poojaController.getMandalPoojas);
router.post('/bulk', poojaController.createBulkPoojas);
router.post('/', uploadPoojaImage.single('image'), poojaController.createMandalPooja);
router.put('/:id', uploadPoojaImage.single('image'), poojaController.updateMandalPooja);
router.delete('/:id', poojaController.deleteMandalPooja);
router.patch('/:id/toggle-status', poojaController.toggleMandalPoojaStatus);

export default router;
