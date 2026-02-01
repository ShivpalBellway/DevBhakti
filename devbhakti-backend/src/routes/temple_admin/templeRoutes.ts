import { Router } from 'express';
import multer from 'multer';
import { registerTemple, getMyTempleProfile, updateMyTempleProfile } from '../../controllers/temple_admin/templeController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

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

const registrationUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 10 }
]);

router.post('/register', registrationUpload, registerTemple);

router.get('/profile', authenticate, authorize('INSTITUTION'), getMyTempleProfile);
router.put('/profile', authenticate, authorize('INSTITUTION'), registrationUpload, updateMyTempleProfile);

export default router;
