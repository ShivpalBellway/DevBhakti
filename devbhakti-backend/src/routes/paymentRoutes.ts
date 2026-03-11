import { Router } from "express";
import { verifyPayment } from "../controllers/paymentController";

const router = Router();

router.post("/verify", verifyPayment);
router.post("/failed", async (req, res) => {
    // Basic logic to trigger WhatsApp on failed payment
    const { phone, userName, referenceId } = req.body;
    try {
        const { sendWhatsAppMessage } = require('../services/whatsappService');
        await sendWhatsAppMessage(
            phone.startsWith('+') ? phone : `+91${phone}`,
            userName || 'Bhakt',
            "payment_failed",
            []
        );
        res.json({ success: true, message: 'Failure notification sent' });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

export default router;
