import express from 'express';
import { getAdminDashboardStats } from '../../controllers/admin/dashboardController';

import { authenticate, checkPermission } from '../../middleware/authMiddleware';

const router = express.Router();

// Auth required
router.use(authenticate);

// Get Dashboard Stats
router.get('/stats', checkPermission('dashboard.view'), getAdminDashboardStats);

export default router;
