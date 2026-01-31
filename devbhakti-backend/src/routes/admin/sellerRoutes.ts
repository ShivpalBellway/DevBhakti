import express from 'express';
import {
    createSeller,
    getAllSellers,
    getSellerById,
    updateSeller,
    deleteSeller,
    toggleSellerStatus
} from '../../controllers/admin/sellerController';

const router = express.Router();

router.post('/', createSeller);
router.get('/', getAllSellers);
router.get('/:id', getSellerById);
router.put('/:id', updateSeller);
router.delete('/:id', deleteSeller);
router.patch('/:id/status', toggleSellerStatus);

export default router;
