"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadUserImage = exports.uploadCmsTestimonial = exports.uploadCmsImage = exports.uploadPoojaImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure upload directory exists
const uploadDir = 'uploads/poojas';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const cmsBannerDir = 'uploads/cms/banners';
const cmsFeatureDir = 'uploads/cms/features';
const cmsTestimonialDir = 'uploads/cms/testimonials';
const cmsCTADir = 'uploads/cms/cta';
const userUploadDir = 'uploads/users';
[cmsBannerDir, cmsFeatureDir, cmsTestimonialDir, cmsCTADir, userUploadDir].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else if (file.mimetype.startsWith('video/') && req.originalUrl.includes('testimonials')) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type!'), false);
    }
};
exports.uploadPoojaImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
exports.uploadCmsImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            if (req.originalUrl.includes('banners')) {
                cb(null, cmsBannerDir);
            }
            else if (req.originalUrl.includes('cta-cards')) {
                cb(null, cmsCTADir);
            }
            else {
                cb(null, cmsFeatureDir);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});
exports.uploadCmsTestimonial = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => cb(null, cmsTestimonialDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos
});
exports.uploadUserImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => cb(null, userUploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'profile-' + uniqueSuffix + path_1.default.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB for profile pics
});
