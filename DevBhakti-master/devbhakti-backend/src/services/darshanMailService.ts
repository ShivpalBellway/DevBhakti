import { sendEmail } from '../utils/sendEmail';

export interface DarshanMailData {
    ticketId: string;
    displayId: string;
    visitorName: string;
    visitorEmail: string;
    visitorPhone: string;
    visitorCount: number;
    templeName: string;
    date: string;
    time: string;
    totalAmount: number;
    platformFee: number;
    qrToken: string;
}

export const sendDarshanConfirmationEmail = async (data: DarshanMailData) => {
    if (!data.visitorEmail) return;

    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://devbhakti.com';
    const qrLink = `${FRONTEND_URL}/darshan/ticket/${data.ticketId}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; }
            .header { background: linear-gradient(135deg, #FF6B00, #FF8F3F); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .ticket-box { background: #FFF8F0; border: 2px dashed #FF6B00; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .ticket-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #FFE0C0; }
            .ticket-row:last-child { border-bottom: none; }
            .ticket-label { color: #666; font-size: 13px; }
            .ticket-value { color: #333; font-weight: 600; font-size: 14px; }
            .qr-section { text-align: center; padding: 20px; }
            .qr-btn { display: inline-block; background: #FF6B00; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; }
            .amount-box { background: #FF6B00; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
            .amount-box .amount { font-size: 28px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🙏 Darshan Pass Confirmed!</h1>
                <p>Your darshan booking has been confirmed</p>
            </div>
            <div class="content">
                <p>Dear <strong>${data.visitorName}</strong>,</p>
                <p>Your darshan pass has been successfully booked. Please show the QR code at the temple entrance.</p>
                
                <div class="ticket-box">
                    <div class="ticket-row">
                        <span class="ticket-label">Pass ID</span>
                        <span class="ticket-value">${data.displayId}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Temple</span>
                        <span class="ticket-value">${data.templeName}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Date</span>
                        <span class="ticket-value">${data.date}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Time Slot</span>
                        <span class="ticket-value">${data.time}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Visitors</span>
                        <span class="ticket-value">${data.visitorCount}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Phone</span>
                        <span class="ticket-value">${data.visitorPhone}</span>
                    </div>
                </div>

                <div class="amount-box">
                    <div style="font-size: 12px; opacity: 0.8;">Total Amount Paid</div>
                    <div class="amount">₹${data.totalAmount.toFixed(2)}</div>
                </div>

                <div class="qr-section">
                    <p style="color: #666; margin-bottom: 15px;">Show this QR code at the temple entrance for entry</p>
                    <a href="${qrLink}" class="qr-btn">🎫 View QR Pass</a>
                </div>

                <p style="color: #999; font-size: 13px; text-align: center;">
                    Please arrive 15 minutes before your scheduled time slot.
                </p>
            </div>
            <div class="footer">
                <p>This is an automated email from Dev Bhakti. Please do not reply.</p>
                <p>© ${new Date().getFullYear()} Dev Bhakti. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await sendEmail(
        data.visitorEmail,
        `🙏 Darshan Pass Confirmed - ${data.displayId} | ${data.templeName}`,
        html
    );
};
