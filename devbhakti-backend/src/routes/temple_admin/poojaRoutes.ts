import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../middleware/authMiddleware';
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

router.use(authenticate);
router.use(authorize('INSTITUTION'));

router.get('/', poojaController.getMyPoojas);
router.post('/', upload.single('image'), poojaController.createMyPooja);
router.put('/:id', upload.single('image'), poojaController.updateMyPooja);
router.delete('/:id', poojaController.deleteMyPooja);
router.patch('/:id/toggle-status', poojaController.togglePoojaStatus);

export default router;
