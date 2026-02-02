import { Router } from 'express';
import { getBankDetails, updateBankDetails } from '../../controllers/temple_admin/bankController';
import { authenticate, authorize } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize('INSTITUTION'));

router.get('/', getBankDetails);
router.put('/', updateBankDetails);

export default router;
