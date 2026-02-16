import express from 'express';
import { getAllUsers, getUserDetail } from '../../controllers/admin/userController';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserDetail);

export default router;
