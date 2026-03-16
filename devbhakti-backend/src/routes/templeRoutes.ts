import { Router } from 'express';
import { getAllTemples, getTempleById, getAllPoojas, getPoojaById, registerTemple, getTempleFilters } from '../controllers/templeController';


const router = Router();

router.get('/filters', getTempleFilters);
router.get('/', getAllTemples);
router.get('/poojas', getAllPoojas);
router.get('/:id', getTempleById);
router.get('/poojas/:id', getPoojaById);
router.post('/register', registerTemple);


export default router;
