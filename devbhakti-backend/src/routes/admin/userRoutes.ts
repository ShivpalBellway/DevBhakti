import express from 'express';
import { getAllUsers, getUserDetail, downloadUsersExcel, downloadUsersAiSensyCSV, toggleUserStatus, bulkToggleUserStatus } from '../../controllers/admin/userController';

import { authenticate, checkPermission } from '../../middleware/authMiddleware';

const router = express.Router();

// Auth required
router.use(authenticate);

router.get('/export/excel', checkPermission('users.view'), downloadUsersExcel);
router.get('/export/aisensy', checkPermission('users.view'), downloadUsersAiSensyCSV);
router.get('/', checkPermission('users.view'), getAllUsers);

// ⚠️ Specific routes BEFORE parameterized ones
router.patch('/bulk/status', checkPermission('users.manage'), bulkToggleUserStatus);
router.patch('/:id/status', checkPermission('users.manage'), toggleUserStatus);

router.get('/:id', checkPermission('users.view'), getUserDetail);

export default router;

