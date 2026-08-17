import { Router } from 'express';
import * as globalSettingsController from '../../controllers/admin/globalSettingsController';
import { authenticate, checkPermission } from '../../middleware/authMiddleware';
import { uploadCmsImage } from '../../middleware/uploadMiddleware';

const router = Router();

// Public GET routes (used by frontend without auth)
router.get('/ratings', globalSettingsController.getRatingsSettings);
router.get('/seo-public', globalSettingsController.getSeoSettings);
// PUBLIC: Frontend checks this to show/hide mandal registration link
router.get('/mandal-registration', globalSettingsController.getMandalRegistrationStatus);

// Middleware for Admin only settings mutations
router.use(authenticate);

// Admin ratings management
router.patch('/ratings', checkPermission('cms.ratings'), globalSettingsController.updateRatingsSettings);

// SEO Meta Tags management
router.get('/seo', globalSettingsController.getSeoSettings);
router.patch('/seo', checkPermission('cms.features'), globalSettingsController.updateSeoSettings);

// ADMIN: Toggle mandal registration ON/OFF & update settings
router.patch('/mandal-registration', checkPermission('cms.features'), uploadCmsImage.single('image'), globalSettingsController.updateMandalRegistrationStatus);

export default router;
