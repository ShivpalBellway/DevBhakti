import { Router } from 'express';
import { getBankDetails, updateBankDetails } from '../../controllers/mandal_admin/bankController';
import { authenticate, authorize, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate, injectMandalContext);

router.get('/', getBankDetails);
router.put('/', updateBankDetails);

export default router;
