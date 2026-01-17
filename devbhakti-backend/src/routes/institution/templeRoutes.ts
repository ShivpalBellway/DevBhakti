import { Router } from 'express';
import { registerTemple } from '../../controllers/institution/templeController';

const router = Router();

router.post('/register', registerTemple);

export default router;
