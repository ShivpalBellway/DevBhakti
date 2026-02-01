import { Router } from 'express';
import * as cmsController from '../../controllers/admin/cmsController';
import { uploadCmsImage, uploadCmsTestimonial } from '../../middleware/uploadMiddleware';

import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

// Public GET routes
router.get('/banners', cmsController.getBanners);
router.get('/features', cmsController.getFeatures);
router.get('/testimonials', cmsController.getTestimonials);
router.get('/cta-cards', cmsController.getCTACards);

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

// Testimonials (Admin)
router.post('/testimonials', uploadCmsTestimonial.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoSrc', maxCount: 1 }]), cmsController.createTestimonial);
router.put('/testimonials/:id', uploadCmsTestimonial.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoSrc', maxCount: 1 }]), cmsController.updateTestimonial);
router.delete('/testimonials/:id', cmsController.deleteTestimonial);

// CTA Cards (Admin)
router.post('/cta-cards', uploadCmsImage.single('icon'), cmsController.createCTACard);
router.put('/cta-cards/:id', uploadCmsImage.single('icon'), cmsController.updateCTACard);
router.delete('/cta-cards/:id', cmsController.deleteCTACard);

export default router;


