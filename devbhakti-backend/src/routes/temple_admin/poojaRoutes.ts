import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize, checkPermission, injectTempleContext } from '../../middleware/authMiddleware';
import * as poojaController from '../../controllers/temple_admin/poojaController';

const router = Router();

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/poojas/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.use(authenticate, injectTempleContext);

router.get('/', checkPermission('poojas.view'), poojaController.getMyPoojas);
router.post('/', checkPermission('poojas.create'), upload.single('image'), poojaController.createMyPooja);
router.put('/:id', checkPermission('poojas.edit'), upload.single('image'), poojaController.updateMyPooja);
router.delete('/:id', checkPermission('poojas.delete'), poojaController.deleteMyPooja);
router.patch('/:id/toggle-status', checkPermission('poojas.edit'), poojaController.togglePoojaStatus);

export default router;
