import { Router } from 'express';
import { getMandalReceiptHTMLResponse, getMandalReceiptPDFResponse } from '../controllers/publicReceiptController';

const router = Router();

/**
 * Public Receipt APIs for Mobile App Integration (Flutter / React Native / Android Native)
 */

// 1. GET /api/mandal/receipts/:transactionId/html  (HTML view for App WebView)
router.get('/:transactionId/html', getMandalReceiptHTMLResponse);

// 2. GET /api/mandal/receipts/:transactionId/pdf   (Binary PDF download)
router.get('/:transactionId/pdf', getMandalReceiptPDFResponse);

export default router;
