import express from 'express';
import { getAdminDashboardStats } from '../../controllers/admin/dashboardController';

const router = express.Router();

// Get Dashboard Stats
router.get('/stats', getAdminDashboardStats);

export default router;
