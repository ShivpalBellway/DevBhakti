import { Router } from 'express';
import { 
    getAllPoojas, 
    createPooja, 
    updatePooja, 
    deletePooja 
} from '../../controllers/admin/poojaController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

import { uploadPoojaImage } from '../../middleware/uploadMiddleware';

const router = Router();

// All routes here require ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllPoojas);
router.post('/', uploadPoojaImage.single('image'), createPooja);
router.put('/:id', uploadPoojaImage.single('image'), updatePooja);
router.delete('/:id', deletePooja);

export default router;
