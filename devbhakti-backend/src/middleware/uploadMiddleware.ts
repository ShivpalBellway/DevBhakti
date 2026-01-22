import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = 'uploads/poojas';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const cmsBannerDir = 'uploads/cms/banners';
const cmsFeatureDir = 'uploads/cms/features';
const cmsTestimonialDir = 'uploads/cms/testimonials';
const cmsCTADir = 'uploads/cms/cta';
const userUploadDir = 'uploads/users';

[cmsBannerDir, cmsFeatureDir, cmsTestimonialDir, cmsCTADir, userUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});


const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else if (file.mimetype.startsWith('video/') && req.originalUrl.includes('testimonials')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type!'), false);
    }
};

export const uploadPoojaImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadCmsImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (req.originalUrl.includes('banners')) {
                cb(null, cmsBannerDir);
            } else if (req.originalUrl.includes('cta-cards')) {
                cb(null, cmsCTADir);
            } else {
                cb(null, cmsFeatureDir);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

export const uploadCmsTestimonial = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, cmsTestimonialDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos
});
export const uploadUserImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, userUploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB for profile pics
});
