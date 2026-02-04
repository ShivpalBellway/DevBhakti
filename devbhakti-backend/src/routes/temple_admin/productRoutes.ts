import { Router } from 'express';
import { createProduct, updateProduct, deleteProduct, getMyProducts, getMyProductById } from '../../controllers/temple_admin/templeProductController';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (req, file, cb) => {
        cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

const router = Router();

router.use(authenticate);
router.use(authorize('INSTITUTION'));

router.get('/', getMyProducts);
router.get('/:id', getMyProductById);
router.post('/', upload.any(), createProduct);
router.put('/:id', upload.any(), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
