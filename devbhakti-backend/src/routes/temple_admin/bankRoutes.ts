import { Router } from 'express';
import { getBankDetails, updateBankDetails } from '../../controllers/temple_admin/bankController';
import { authenticate, authorize, checkPermission, injectTempleContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate, injectTempleContext);

router.get('/', checkPermission('temple.bank.manage'), getBankDetails);
router.put('/', checkPermission('temple.bank.manage'), updateBankDetails);

export default router;
