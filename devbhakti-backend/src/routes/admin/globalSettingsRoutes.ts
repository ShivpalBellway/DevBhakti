import { Router } from 'express';
import * as globalSettingsController from '../../controllers/admin/globalSettingsController';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';

const router = Router();

// Public GET route (if needed by frontend devotees, but usually handled by public controllers)
router.get('/ratings', globalSettingsController.getRatingsSettings);
router.get('/seo-public', globalSettingsController.getSeoSettings);


// Middleware for Admin only settings mutations
router.use(authenticate);

// Admin ratings management
router.patch('/ratings', checkPermission('cms.features'), globalSettingsController.updateRatingsSettings);

// SEO Meta Tags management
router.get('/seo', globalSettingsController.getSeoSettings);
router.patch('/seo', checkPermission('cms.features'), globalSettingsController.updateSeoSettings);


export default router;
