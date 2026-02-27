import express from 'express';
import { getAllUsers, getUserDetail, downloadUsersExcel } from '../../controllers/admin/userController';

import { authenticate, checkPermission } from '../../middleware/authMiddleware';

const router = express.Router();

// Auth required
router.use(authenticate);

router.get('/export/excel', checkPermission('users.view'), downloadUsersExcel);
router.get('/', checkPermission('users.view'), getAllUsers);
router.get('/:id', checkPermission('users.view'), getUserDetail);

export default router;
