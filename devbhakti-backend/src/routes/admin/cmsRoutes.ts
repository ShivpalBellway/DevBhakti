import { Router } from 'express';
import * as cmsController from '../../controllers/admin/cmsController';
import { uploadCmsImage, uploadCmsTestimonial } from '../../middleware/uploadMiddleware';

import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';

const router = Router();

// Public GET routes
router.get('/banners', cmsController.getBanners);
router.get('/banners/global-status', cmsController.getBannerGlobalStatus);
router.get('/features', cmsController.getFeatures);
router.get('/testimonials', cmsController.getTestimonials);
router.get('/cta-cards', cmsController.getCTACards);

// Middleware for Admin only CMS mutations
router.use(authenticate);

// Banners (Admin)
router.post('/banners', checkPermission('cms.banners'), uploadCmsImage.single('image'), cmsController.createBanner);
router.put('/banners/:id', checkPermission('cms.banners'), uploadCmsImage.single('image'), cmsController.updateBanner);
router.patch('/banners/global-status', checkPermission('cms.banners'), cmsController.toggleBannerGlobalStatus);
router.delete('/banners/:id', checkPermission('cms.banners'), cmsController.deleteBanner);

// Features (Admin)
router.post('/features', checkPermission('cms.features'), uploadCmsImage.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), cmsController.createFeature);
router.put('/features/:id', checkPermission('cms.features'), uploadCmsImage.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), cmsController.updateFeature);
router.delete('/features/:id', checkPermission('cms.features'), cmsController.deleteFeature);

// Testimonials (Admin)
router.post('/testimonials', checkPermission('cms.testimonials'), uploadCmsTestimonial.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoSrc', maxCount: 1 }]), cmsController.createTestimonial);
router.put('/testimonials/:id', checkPermission('cms.testimonials'), uploadCmsTestimonial.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoSrc', maxCount: 1 }]), cmsController.updateTestimonial);
router.delete('/testimonials/:id', checkPermission('cms.testimonials'), cmsController.deleteTestimonial);

// CTA Cards (Admin)
router.post('/cta-cards', checkPermission('cms.features'), uploadCmsImage.single('icon'), cmsController.createCTACard);
router.put('/cta-cards/:id', checkPermission('cms.features'), uploadCmsImage.single('icon'), cmsController.updateCTACard);
router.delete('/cta-cards/:id', checkPermission('cms.features'), cmsController.deleteCTACard);

export default router;


