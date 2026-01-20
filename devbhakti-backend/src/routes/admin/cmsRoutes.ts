import { Router } from 'express';
import * as cmsController from '../../controllers/admin/cmsController';
import { uploadCmsImage } from '../../middleware/uploadMiddleware';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

// Public GET routes
router.get('/banners', cmsController.getBanners);
router.get('/features', cmsController.getFeatures);

// Middleware for Admin only CMS mutations
router.use(authenticate);
router.use(authorize('ADMIN'));

// Banners (Admin)
router.post('/banners', uploadCmsImage.single('image'), cmsController.createBanner);
router.put('/banners/:id', uploadCmsImage.single('image'), cmsController.updateBanner);
router.delete('/banners/:id', cmsController.deleteBanner);

// Features (Admin)
router.post('/features', uploadCmsImage.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), cmsController.createFeature);
router.put('/features/:id', uploadCmsImage.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), cmsController.updateFeature);
router.delete('/features/:id', cmsController.deleteFeature);

export default router;

