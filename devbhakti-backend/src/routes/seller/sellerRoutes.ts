import { Router } from "express";
import { getSellerProfile, updateSellerProfile } from "../../controllers/seller/sellerController";
import { authenticate, checkPermission, injectSellerContext } from "../../middleware/authMiddleware";
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (req, file, cb) => {
        cb(null, `seller-profile-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

const router = Router();

router.use(authenticate, injectSellerContext);

router.get("/profile", checkPermission('seller.profile.manage'), getSellerProfile);
router.put("/profile", checkPermission('seller.profile.manage'), upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 5 }
]), updateSellerProfile);

export default router;
