export interface ReceiptItem {
  srNo?: number;
  description: string;
  quantity: number;
  amount: number;
}

export interface SponsorBanner {
  id?: string;
  imageUrl: string;
  name?: string;
}

export interface MandalReceiptData {
  receiptNo: string;
  dateTime: string;
  paymentMode: string;
  transactionId: string;
  mandalName: string;
  mandalAddress?: string;
  mandalSlug?: string;
  headerBanner?: string | null;
  sponsors?: SponsorBanner[];
  items: ReceiptItem[];
  totalAmount: number;
  customThankYouNote?: string;
  devoteeName?: string;
  devoteePhone?: string;
}

export const generateMandalReceiptHTML = (data: MandalReceiptData) => {
  const mandalName = data.mandalName || "Mandal / Temple";
  const address = data.mandalAddress || "India";
  const mandalSlug = data.mandalSlug || "mandal";
  const mandalPageUrl = `devbhakti.com/mandals/${mandalSlug}`;
  const fullMandalUrl = `https://devbhakti.com/mandals/${mandalSlug}`;

  // QR Code generator pointing to Mandal Detail Page
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullMandalUrl)}`;

  const displayItems = [...data.items];
  while (displayItems.length < 5) {
    displayItems.push({
      srNo: displayItems.length + 1,
      description: "",
      quantity: 0,
      amount: 0,
    });
  }

  displayItems.forEach((item, index) => {
    item.srNo = index + 1;
  });

  const sponsors = data.sponsors || [];
  const hasSponsors = sponsors.length > 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Receipt - ${data.receiptNo}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; margin: 0; }
        .receipt-card { max-width: 680px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff; overflow: hidden; }
        .header-banner-container { width: 100%; max-height: 140px; overflow: hidden; background: #7b4623; }
        .header-banner-img { width: 100%; height: auto; display: block; object-fit: cover; }
        .text-header-box { text-align: center; padding: 24px 20px 12px 20px; background: #fffdfa; }
        .text-header-title { font-size: 22px; font-weight: 800; color: #7b4623; }
        .text-header-address { font-size: 13px; color: #64748b; margin-top: 4px; }
        .receipt-body { padding: 24px 28px; }
        .receipt-for-label { font-size: 12px; color: #64748b; }
        .receipt-mandal-title { font-size: 18px; font-weight: 800; color: #0f172a; }
        .receipt-mandal-address { font-size: 12px; color: #64748b; margin-top: 2px; }
        .details-grid { display: flex; justify-content: space-between; align-items: center; background: #fdfaf6; border: 1px solid #f1e6da; border-radius: 10px; padding: 14px 18px; margin: 16px 0 20px 0; }
        .detail-label { color: #64748b; font-size: 12px; }
        .detail-val { color: #0f172a; font-weight: 700; font-family: monospace; font-size: 12px; }
        .powered-by-text { font-size: 10px; color: #64748b; text-transform: uppercase; }
        .brand-logo-text { font-size: 16px; font-weight: 800; color: #7b4623; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #7b4623; color: #ffffff; font-size: 12px; font-weight: 700; text-align: left; padding: 10px 12px; }
        .items-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
        .total-row td { border-top: 2px solid #7b4623; font-weight: 800; font-size: 14px; color: #0f172a; }
        .bottom-flex-block { display: flex; justify-content: space-between; align-items: center; background: #fefcf9; border: 1px solid #f5eae0; border-radius: 10px; padding: 16px 20px; margin-bottom: 18px; }
        .thankyou-heading { font-size: 14px; font-weight: 800; color: #7b4623; }
        .thankyou-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
        .qr-label { font-size: 11px; font-weight: 700; color: #334155; }
        .qr-img { width: 80px; height: 80px; border-radius: 6px; }
        .notes-box { font-size: 11px; color: #64748b; margin-bottom: 20px; }
        .sponsor-container { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; text-align: center; }
        .sponsor-header-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .sponsor-strip-img { width: 100%; max-height: 70px; object-fit: contain; margin-bottom: 8px; }
        .devbhakti-fixed-footer { background: #ffffff; border-top: 1px solid #e2e8f0; padding: 12px 24px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        ${data.headerBanner ? `
          <div class="header-banner-container">
            <img src="${data.headerBanner}" class="header-banner-img" alt="${mandalName} Banner" />
          </div>
        ` : `
          <div class="text-header-box">
            <div class="text-header-title">${mandalName}</div>
            <div class="text-header-address">${address}</div>
          </div>
        `}
        <div class="receipt-body">
          ${data.headerBanner ? `
            <div style="margin-bottom: 14px;">
              <div class="receipt-for-label">Receipt for</div>
              <div class="receipt-mandal-title">${mandalName}</div>
              <div class="receipt-mandal-address">${address}</div>
            </div>
          ` : ''}

          <div class="details-grid">
            <table>
              <tr><td class="detail-label">Receipt No.</td><td>: <span class="detail-val">${data.receiptNo}</span></td></tr>
              <tr><td class="detail-label">Date & Time</td><td>: <span class="detail-val">${data.dateTime}</span></td></tr>
              <tr><td class="detail-label">Payment Mode</td><td>: <span class="detail-val">${data.paymentMode}</span></td></tr>
              <tr><td class="detail-label">Transaction ID</td><td>: <span class="detail-val">${data.transactionId}</span></td></tr>
            </table>
            <div style="text-align: right;">
              <div class="powered-by-text">Powered by</div>
              <div class="brand-logo-text">DevBhakti</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th width="10%">Sr. No.</th>
                <th width="55%">Description</th>
                <th width="15%" style="text-align: center;">Qty</th>
                <th width="20%" style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${displayItems.map((item) => `
                <tr>
                  <td style="text-align: center;">${item.srNo}</td>
                  <td>${item.description || '—'}</td>
                  <td style="text-align: center;">${item.amount > 0 ? (item.quantity || 1) : '—'}</td>
                  <td style="text-align: right;">${item.amount > 0 ? item.amount.toLocaleString('en-IN') : '—'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Total Amount</td>
                <td style="text-align: right; font-size: 16px; color: #7b4623;">₹ ${data.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="bottom-flex-block">
            <div>
              <div style="font-size: 20px;">🙏</div>
              <div class="thankyou-heading">Thank you for your generous contribution!</div>
              <div class="thankyou-sub">${data.customThankYouNote || "Your support helps us continue our seva and keep our traditions alive."}</div>
            </div>
            <div style="text-align: center; border-left: 1px solid #f1e6da; padding-left: 16px;">
              <div class="qr-label">Scan to visit our Mandal page</div>
              <img src="${qrCodeUrl}" class="qr-img" />
              <div style="font-size: 9px; color: #64748b; margin-top: 4px;">${mandalPageUrl}</div>
            </div>
          </div>

          <div class="notes-box">
            <strong>Notes:</strong><br/>
            1. This is a system generated receipt for your contribution to ${mandalName}.<br/>
            2. For any queries, please contact the Mandal.
          </div>

          ${hasSponsors ? `
            <div class="sponsor-container">
              <div class="sponsor-header-title">Thank you to our esteemed sponsors</div>
              ${sponsors.map(sp => `<img src="${sp.imageUrl}" class="sponsor-strip-img" />`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="devbhakti-fixed-footer">
          <div><strong>🕉️ DevBhakti</strong></div>
          <div>devbhakti.com | support@devbhakti.com | +91 98195 23719</div>
        </div>
      </div>
    </body>
    </html>
  `;
};
