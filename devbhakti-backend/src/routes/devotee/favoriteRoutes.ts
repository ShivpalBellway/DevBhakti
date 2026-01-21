import { Router } from 'express';
import * as favoriteController from '../../controllers/devotee/favoriteController';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// All favorite routes require authentication
router.use(authenticate);

router.get('/', favoriteController.getFavorites);
router.post('/add', favoriteController.addFavorite);
router.post('/remove', favoriteController.removeFavorite);

export default router;
