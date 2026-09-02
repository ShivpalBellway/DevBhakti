import { Router } from 'express';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';
import * as donationController from '../../controllers/mandal_admin/donationController';

const router = Router();

router.use(authenticate, injectMandalContext);

router.get('/', donationController.getMandalDonations);
router.post('/', donationController.createMandalDonation);
router.delete('/:id', donationController.deleteMandalDonation);
router.get('/stats', donationController.getMandalDonationStats);

export default router;
