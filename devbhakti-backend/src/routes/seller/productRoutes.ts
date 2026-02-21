import { Router } from 'express';
import { createProduct, updateProduct, deleteProduct, getMyProducts, getMyProductById } from '../../controllers/seller/productController';
import { authenticate, checkPermission, injectSellerContext } from '../../middleware/authMiddleware';
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

router.use(authenticate, injectSellerContext);

router.get('/', checkPermission('products.view'), getMyProducts);
router.get('/:id', checkPermission('products.view'), getMyProductById);
router.post('/', checkPermission('products.create'), upload.any(), createProduct);
router.put('/:id', checkPermission('products.edit'), upload.any(), updateProduct);
router.delete('/:id', checkPermission('products.delete'), deleteProduct);

export default router;
