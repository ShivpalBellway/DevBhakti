import express from 'express';
import multer from 'multer';
import {
    getAllTemples,
    createTemple,
    updateTemple,
    deleteTemple,
    toggleTempleStatus
} from '../../controllers/admin/templeController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temples/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Routes with multiple file fields
const templeUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 10 }
]);

// All routes here require ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllTemples);
router.post('/', templeUpload, createTemple);
router.put('/:id', templeUpload, updateTemple);
router.patch('/:id/status', toggleTempleStatus);
router.delete('/:id', deleteTemple);

export default router;
