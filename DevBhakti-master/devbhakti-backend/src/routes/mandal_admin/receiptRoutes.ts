import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getReceiptConfig, updateReceiptConfig, getPublicReceiptConfig, renderReceiptHTML } from '../../controllers/mandal_admin/receiptController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads/mandals');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/mandals/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.get('/', authenticate, injectMandalContext, getReceiptConfig);
router.post('/', authenticate, injectMandalContext, (upload as any).fields([
    { name: 'receiptHeaderBanner', maxCount: 1 },
    { name: 'sponsorBanners', maxCount: 5 }
]), updateReceiptConfig);

router.get('/public/:idOrSlug', getPublicReceiptConfig);
router.get('/render-html/:type/:transactionId', renderReceiptHTML);

export default router;
