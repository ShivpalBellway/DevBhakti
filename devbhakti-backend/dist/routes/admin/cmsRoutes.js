"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cmsController = __importStar(require("../../controllers/admin/cmsController"));
const uploadMiddleware_1 = require("../../middleware/uploadMiddleware");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public GET routes
router.get('/banners', cmsController.getBanners);
router.get('/features', cmsController.getFeatures);
router.get('/testimonials', cmsController.getTestimonials);
router.get('/cta-cards', cmsController.getCTACards);
// Middleware for Admin only CMS mutations
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.authorize)('ADMIN'));
// Banners (Admin)
router.post('/banners', uploadMiddleware_1.uploadCmsImage.single('image'), cmsController.createBanner);
router.put('/banners/:id', uploadMiddleware_1.uploadCmsImage.single('image'), cmsController.updateBanner);
router.delete('/banners/:id', cmsController.deleteBanner);
// Features (Admin)
router.post('/features', uploadMiddleware_1.uploadCmsImage.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), cmsController.createFeature);
router.put('/features/:id', uploadMiddleware_1.uploadCmsImage.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), cmsController.updateFeature);
router.delete('/features/:id', cmsController.deleteFeature);
// Testimonials (Admin)
router.post('/testimonials', uploadMiddleware_1.uploadCmsTestimonial.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoSrc', maxCount: 1 }]), cmsController.createTestimonial);
router.put('/testimonials/:id', uploadMiddleware_1.uploadCmsTestimonial.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoSrc', maxCount: 1 }]), cmsController.updateTestimonial);
router.delete('/testimonials/:id', cmsController.deleteTestimonial);
// CTA Cards (Admin)
router.post('/cta-cards', uploadMiddleware_1.uploadCmsImage.single('icon'), cmsController.createCTACard);
router.put('/cta-cards/:id', uploadMiddleware_1.uploadCmsImage.single('icon'), cmsController.updateCTACard);
router.delete('/cta-cards/:id', cmsController.deleteCTACard);
exports.default = router;
