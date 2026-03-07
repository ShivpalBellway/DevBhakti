import { Router } from 'express';
import * as authController from '../../controllers/devotee/authController';
import { authenticate } from '../../middleware/authMiddleware';
import { uploadUserImage } from '../../middleware/uploadMiddleware';



const router = Router();

// Devotee Auth Routes
router.get('/test', (req, res) => res.json({ message: 'Auth routes are working' }));
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.get('/check-phone', authController.checkPhoneExistence);

// Profile Management (Protected)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, uploadUserImage.single('profileImage'), authController.updateProfile);

export default router;
