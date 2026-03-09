import express from 'express';
import multer from 'multer';
import {
    getAllTemples,
    createTemple,
    updateTemple,
    deleteTemple,
    toggleTempleStatus,
    getPendingUpdateRequests,
    approveUpdateRequest,
    rejectUpdateRequest,
    updateTempleLiveConfig,
    setPrimaryLive,
    getTempleCategories
} from '../../controllers/admin/templeController';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';

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

// Authentication is required for all routes
router.use(authenticate);

// Update Request Routes
router.get('/update-requests', checkPermission('temples.requests_view'), getPendingUpdateRequests);
router.post('/update-requests/:id/approve', checkPermission('temples.verify'), approveUpdateRequest);
router.post('/update-requests/:id/reject', checkPermission('temples.verify'), rejectUpdateRequest);

router.get('/categories', checkPermission('temples.view'), getTempleCategories);
router.get('/', checkPermission('temples.view'), getAllTemples);
router.post('/', checkPermission('temples.create'), templeUpload, createTemple);
router.put('/:id', checkPermission('temples.edit'), templeUpload, updateTemple);
router.patch('/:id/status', checkPermission('temples.edit'), toggleTempleStatus);
router.patch('/:id/live-config', checkPermission('temples.edit'), updateTempleLiveConfig);
router.patch('/:id/set-primary-live', checkPermission('temples.edit'), setPrimaryLive);
router.delete('/:id', checkPermission('temples.delete'), deleteTemple);

export default router;
