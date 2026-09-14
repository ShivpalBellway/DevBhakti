import { Router } from 'express';
import { getDailyReport, getDailyReportHistory, triggerDailyReportJob } from '../controllers/dailyReportController';

const router = Router();

// GET /api/reports/daily - Fetch generated or real-time daily activity report
router.get('/', getDailyReport);

// GET /api/reports/daily/history - Fetch past daily activity reports history
router.get('/history', getDailyReportHistory);

// POST /api/reports/daily/trigger - Admin endpoint to manually trigger report generation job
router.post('/trigger', triggerDailyReportJob);

export default router;
