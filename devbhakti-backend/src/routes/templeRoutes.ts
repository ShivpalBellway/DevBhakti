import { Router } from 'express';
import { getAllTemples, registerTemple } from '../controllers/templeController';

const router = Router();

router.get('/', getAllTemples);
router.post('/register', registerTemple);

export default router;
