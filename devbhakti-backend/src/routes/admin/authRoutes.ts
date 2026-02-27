import { Router } from 'express';
import { adminLogin, staffForgotPasswordRequest } from '../../controllers/admin/authController';

const router = Router();

router.post('/login', adminLogin);
router.post('/staff-forgot-password', staffForgotPasswordRequest);

export default router;
