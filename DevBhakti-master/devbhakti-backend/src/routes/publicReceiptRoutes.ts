import { Router } from 'express';
import { getMandalReceiptHTMLResponse, getMandalReceiptPDFResponse } from '../controllers/publicReceiptController';

const router = Router();

/**
 * Public Receipt APIs for Mobile App Integration (Flutter / React Native / Android Native)
 */

// 1. GET /api/v1/mandal/receipts/:transactionId/html  (or /api/mandal/receipts/:transactionId/html)
router.get('/:transactionId/html', getMandalReceiptHTMLResponse);

// 2. GET /api/v1/mandal/receipts/:transactionId/pdf   (or /api/mandal/receipts/:transactionId/pdf)
router.get('/:transactionId/pdf', getMandalReceiptPDFResponse);

export default router;
