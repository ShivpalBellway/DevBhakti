import { Router } from 'express';
import { createProduct, updateProduct, deleteProduct, getMyProducts, getMyProductById } from '../../controllers/seller/productController';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (req, file, cb) => {
        cb(null, `seller-product-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

const router = Router();

router.use(authenticate);
router.use(authorize('SELLER'));

router.get('/', getMyProducts);
router.get('/:id', getMyProductById);
router.post('/', upload.single('image'), createProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
