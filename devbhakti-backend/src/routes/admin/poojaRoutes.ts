import { Router } from 'express';
import {
    getAllPoojas,
    createPooja,
    updatePooja,
    deletePooja,
    promoteToMaster,
    togglePoojaStatus
} from '../../controllers/admin/poojaController';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';

import { uploadPoojaImage } from '../../middleware/uploadMiddleware';

const router = Router();

// Authentication is required for all routes
router.use(authenticate);

// Applying granular permissions
router.get('/', checkPermission('poojas.view'), getAllPoojas);
router.post('/', checkPermission('poojas.create'), uploadPoojaImage.single('image'), createPooja);
router.put('/:id', checkPermission('poojas.edit'), uploadPoojaImage.single('image'), updatePooja);
router.post('/:id/promote', checkPermission('poojas.promote'), promoteToMaster);
router.patch('/:id/toggle-status', checkPermission('poojas.edit'), togglePoojaStatus);
router.delete('/:id', checkPermission('poojas.delete'), deletePooja);

export default router;
