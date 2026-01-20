import { Router } from 'express';
import * as authController from '../../controllers/devotee/authController';
import { authenticate } from '../../middleware/authMiddleware';
import { uploadUserImage } from '../../middleware/uploadMiddleware';



const router = Router();

// Devotee Auth Routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

// Profile Management (Protected)
router.put('/profile', authenticate, uploadUserImage.single('profileImage'), authController.updateProfile);

export default router;
