import { Router } from 'express';
import multer from 'multer';
import { registerTemple, getMyTempleProfile, updateMyTempleProfile } from '../../controllers/temple_admin/templeController';
import { authenticate, authorize, checkPermission, injectTempleContext } from '../../middleware/authMiddleware';

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

// ... (Multer Config remains same)

router.post('/register', (upload as any).fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 10 }
]), registerTemple);

router.get('/profile', authenticate, injectTempleContext, checkPermission('temple.profile.manage'), getMyTempleProfile);
router.put('/profile', authenticate, injectTempleContext, (upload as any).fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 10 }
]), checkPermission('temple.profile.manage'), updateMyTempleProfile);

export default router;
