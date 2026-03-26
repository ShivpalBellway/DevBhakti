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
router.post('/check-phone', authController.checkPhoneOnly); // ✅ New API - POST method, no OTP
router.post('/check-seller', authController.checkSellerPhone); // ✅ Seller portal - check if phone is registered as SELLER
router.post('/check-email', authController.checkEmailExists); // ✅ Check if email is already registered
router.post('/check-institution', authController.checkInstitutionPhone); // ✅ Temple registration - check if phone is INSTITUTION role

// Profile Management (Protected)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, uploadUserImage.single('profileImage'), authController.updateProfile);
router.delete('/account', authenticate, authController.deleteAccount); // ✅ User account deletion

export default router;
