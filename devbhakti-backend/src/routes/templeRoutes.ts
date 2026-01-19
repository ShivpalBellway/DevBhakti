import { Router } from 'express';
import { getAllTemples, registerTemple, getPoojaById } from '../controllers/templeController';

const router = Router();

router.get('/', getAllTemples);
router.post('/register', registerTemple);
router.get('/poojas/:id', getPoojaById);

export default router;
