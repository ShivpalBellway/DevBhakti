import { sendEmail } from '../utils/sendEmail';

export interface OrderMailData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    paymentMethod: string;
    shippingAddress: any;
    items: any[];
    receiptBuffer: Buffer;
    receiptFilename: string;
}

export const sendOrderInvoiceEmail = async (data: OrderMailData) => {
    if (!data.customerEmail) return;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: #7c4624; color: white; padding: 40px 20px; text-align: center; }
                .content { padding: 30px; }
                .section { margin-bottom: 25px; }
                .section-title { font-weight: bold; border-bottom: 1px solid #7c462433; padding-bottom: 8px; margin-bottom: 15px; color: #7c4624; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                .label { color: #666; }
                .value { font-weight: 600; color: #333; }
                .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f1f1; font-size: 13px; }
                .amount-box { background: #fdf6f0; border: 1px solid #7c4624; padding: 25px 15px; text-align: center; border-radius: 10px; margin: 30px 0; }
                .amount-label { font-size: 12px; color: #7c4624; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px; }
                .amount-value { font-size: 32px; font-weight: bold; color: #7c4624; margin: 5px 0; }
                .footer { background: #f9f9f9; padding: 25px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">DEV BHAKTI</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Order Confirmation & Invoice</p>
                </div>
                <div class="content">
                    <p>Namaste <strong>${data.customerName}</strong>,</p>
                    <p>Thank you for shopping with DevBhakti. Your order has been placed successfully and is being processed.</p>
                    
                    <div class="section">
                        <div class="section-title">Order Details</div>
                        <div class="info-row"><span class="label">Order ID</span><span class="value">#${data.orderId.slice(-8).toUpperCase()}</span></div>
                        <div class="info-row"><span class="label">Date</span><span class="value">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                        <div class="info-row"><span class="label">Payment Status</span><span class="value" style="color: #2e7d32;">PAID</span></div>
                    </div>

                    <div class="section">
                        <div class="section-title">Items Ordered</div>
                        ${data.items.map(item => `
                            <div class="item-row">
                                <span>${item.productName || 'Sacred Item'} (x${item.quantity})</span>
                                <span class="value">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="amount-box">
                        <div class="amount-label">Grand Total Paid</div>
                        <div class="amount-value">₹ ${data.totalAmount.toLocaleString('en-IN')}</div>
                        <p style="font-size: 11px; margin-top: 10px; opacity: 0.8;">Shipping: Free | Price includes all taxes</p>
                    </div>

                    <p style="font-size: 14px;">Please find your official invoice attached to this email for your reference.</p>
                    
                    <div style="margin-top: 30px; text-align: center; border-radius: 8px; padding: 15px; border-left: 4px solid #7c4624; background: #fdf6f0;">
                        <p style="margin: 0; font-size: 13px; font-style: italic; color: #7c4624;">
                            "Your contribution helps support local artisans and preserve our sacred traditions."
                        </p>
                    </div>
                </div>
                <div class="footer">
                    <p>For any queries, please visit www.devbhakti.com or contact our support team.</p>
                    <p>&copy; ${new Date().getFullYear()} Dev Bhakti. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(
        data.customerEmail,
        `Order Confirmed: #${data.orderId.slice(-8).toUpperCase()} - Dev Bhakti`,
        `Your order #${data.orderId.slice(-8).toUpperCase()} has been confirmed. Total amount: ₹${data.totalAmount}. Please find the invoice attached.`,
        html,
        [
            {
                filename: data.receiptFilename,
                content: data.receiptBuffer,
                contentType: 'application/pdf'
            }
        ]
    );
};
