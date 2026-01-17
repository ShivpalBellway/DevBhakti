import { Router } from 'express';
import { adminLogin } from '../../controllers/admin/authController';

const router = Router();

router.post('/login', adminLogin);

export default router;
