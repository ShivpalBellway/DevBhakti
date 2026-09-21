import { parseLocalizedValue } from "./textUtils";

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
  const rawMandalName = data.mandalName || "Mandal / Temple";
  const mandalName = parseLocalizedValue(rawMandalName) || "Mandal / Temple";
  const address = data.mandalAddress || "India";
  const mandalSlug = data.mandalSlug || "mandal";
  const mandalPageUrl = `devbhakti.com/mandals/${mandalSlug}`;
  const fullMandalUrl = `https://devbhakti.com/mandals/${mandalSlug}`;

  // QR Code generator using QR Server API pointing to Mandal Detail Page
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullMandalUrl)}`;

  // Minimum 5 items in table as per visual template rules
  const displayItems = [...data.items];
  while (displayItems.length < 5) {
    displayItems.push({
      srNo: displayItems.length + 1,
      description: "",
      quantity: 0,
      amount: 0,
    });
  }

  // Ensure Sr. No. is set for filled items
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
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; }
        
        .receipt-card {
          max-width: 680px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          position: relative;
        }

        /* 1. Dynamic Header Banner */
        .header-banner-container {
          width: 100%;
          max-height: 140px;
          overflow: hidden;
          background: #7b4623;
        }
        .header-banner-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .text-header-box {
          text-align: center;
          padding: 24px 20px 12px 20px;
          background: #fffdfa;
        }
        .text-header-title {
          font-family: 'Inter', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #7b4623;
        }
        .text-header-address {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        .header-om-icon {
          font-size: 20px;
          color: #7b4623;
          margin-top: 6px;
        }

        .receipt-body {
          padding: 24px 28px;
        }

        /* 2. Receipt For Header */
        .receipt-for-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 2px;
        }
        .receipt-mandal-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .receipt-mandal-address {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        /* 3. Details Block */
        .details-grid {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fdfaf6;
          border: 1px solid #f1e6da;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 18px 0 22px 0;
        }
        .details-left-table {
          border-collapse: collapse;
        }
        .details-left-table td {
          padding: 3px 12px 3px 0;
          font-size: 12px;
        }
        .detail-label {
          color: #64748b;
          font-weight: 500;
        }
        .detail-val {
          color: #0f172a;
          font-weight: 700;
          font-family: monospace;
        }
        .powered-by-box {
          text-align: right;
        }
        .powered-by-text {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .brand-logo-text {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: 800;
          color: #7b4623;
        }

        /* 4. Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background: #7b4623;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 10px 14px;
        }
        .items-table th.num-col, .items-table td.num-col { text-align: center; }
        .items-table th.amount-col, .items-table td.amount-col { text-align: right; }
        .items-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          color: #334155;
        }
        .total-row td {
          border-top: 2px solid #7b4623;
          border-bottom: none;
          font-weight: 800;
          font-size: 14px;
          color: #0f172a;
          padding-top: 14px;
        }
        .total-amount-val {
          font-size: 18px;
          color: #7b4623;
        }

        /* 5. Thank You & QR Block */
        .bottom-flex-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fefcf9;
          border: 1px solid #f5eae0;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 18px;
        }
        .thankyou-left {
          flex: 1;
          padding-right: 16px;
          text-align: center;
        }
        .hands-icon {
          font-size: 26px;
          margin-bottom: 4px;
        }
        .thankyou-heading {
          font-size: 14px;
          font-weight: 800;
          color: #7b4623;
        }
        .thankyou-sub {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
          line-height: 1.4;
        }
        .qr-right {
          text-align: center;
          border-left: 1px solid #f1e6da;
          padding-left: 20px;
          shrink: 0;
        }
        .qr-label {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }
        .qr-img {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .qr-url-text {
          font-size: 9px;
          color: #64748b;
          margin-top: 4px;
          word-break: break-all;
        }

        /* 6. Notes */
        .notes-box {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 22px;
          line-height: 1.5;
        }
        .notes-title {
          font-weight: 700;
          color: #334155;
        }

        /* 7. Sponsor Section (Optional) */
        .sponsor-container {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          margin-top: 16px;
          text-align: center;
        }
        .sponsor-header-title {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .sponsor-strips-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sponsor-strip-img {
          width: 100%;
          max-height: 70px;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }

        /* 8. Fixed DevBhakti Footer */
        .devbhakti-fixed-footer {
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          padding: 14px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #64748b;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: #7b4623;
        }
        .footer-contacts {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media print {
          body { padding: 0; background: #ffffff; }
          .receipt-card { box-shadow: none; border-color: #cbd5e1; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        
        <!-- 1. HEADER SECTION -->
        ${data.headerBanner ? `
          <div class="header-banner-container">
            <img src="${data.headerBanner}" class="header-banner-img" alt="${mandalName} Banner" />
          </div>
        ` : `
          <div class="text-header-box">
            <div class="text-header-title">${mandalName}</div>
            <div class="text-header-address">${address}</div>
            <div class="header-om-icon">🪔 🕉️ 🪔</div>
          </div>
        `}

        <div class="receipt-body">
          
          <!-- 2. RECEIPT FOR -->
          ${data.headerBanner ? `
            <div style="margin-bottom: 14px;">
              <div class="receipt-for-label">Receipt for</div>
              <div class="receipt-mandal-title">${mandalName}</div>
              <div class="receipt-mandal-address">${address}</div>
            </div>
          ` : ''}

          <!-- 3. DETAILS BLOCK -->
          <div class="details-grid">
            <table class="details-left-table">
              <tr>
                <td class="detail-label">Receipt No.</td>
                <td>: <span class="detail-val">${data.receiptNo}</span></td>
              </tr>
              <tr>
                <td class="detail-label">Date & Time</td>
                <td>: <span class="detail-val">${data.dateTime}</span></td>
              </tr>
              <tr>
                <td class="detail-label">Payment Mode</td>
                <td>: <span class="detail-val">${data.paymentMode}</span></td>
              </tr>
              <tr>
                <td class="detail-label">Transaction ID</td>
                <td>: <span class="detail-val">${data.transactionId}</span></td>
              </tr>
            </table>

            <div class="powered-by-box">
              <div class="powered-by-text">Powered by</div>
              <div class="brand-logo-text">DevBhakti</div>
            </div>
          </div>

          <!-- 4. ITEMS TABLE -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="num-col" width="10%">Sr. No.</th>
                <th width="55%">Description</th>
                <th class="num-col" width="15%">Qty</th>
                <th class="amount-col" width="20%">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${displayItems.map((item) => `
                <tr>
                  <td class="num-col">${item.srNo}</td>
                  <td>${item.description || '—'}</td>
                  <td class="num-col">${item.amount > 0 ? (item.quantity || 1) : '—'}</td>
                  <td class="amount-col">${item.amount > 0 ? item.amount.toLocaleString('en-IN') : '—'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right; padding-right: 14px;">Total Amount</td>
                <td class="amount-col total-amount-val">₹ ${data.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <!-- 5. THANK YOU & QR SECTION -->
          <div class="bottom-flex-block">
            <div class="thankyou-left">
              <div class="hands-icon">🙏</div>
              <div class="thankyou-heading">Thank you for your generous contribution!</div>
              <div class="thankyou-sub">${data.customThankYouNote || "Your support helps us continue our seva and keep our traditions alive."}</div>
            </div>
            <div class="qr-right">
              <div class="qr-label">Scan to visit our Mandal page</div>
              <img src="${qrCodeUrl}" class="qr-img" alt="Mandal Page QR Code" />
              <div class="qr-url-text">${mandalPageUrl}</div>
            </div>
          </div>

          <!-- 6. NOTES SECTION -->
          <div class="notes-box">
            <span class="notes-title">Notes:</span><br/>
            1. This is a system generated receipt for your contribution to ${mandalName}.<br/>
            2. For any queries, please contact the Mandal.
          </div>

          <!-- 7. SPONSOR SECTION (OPTIONAL) -->
          ${hasSponsors ? `
            <div class="sponsor-container">
              <div class="sponsor-header-title">Thank you to our esteemed sponsors</div>
              <div class="sponsor-strips-wrapper">
                ${sponsors.map(sp => `
                  <img src="${sp.imageUrl}" class="sponsor-strip-img" alt="${sp.name || 'Sponsor'}" />
                `).join('')}
              </div>
            </div>
          ` : ''}

        </div>

        <!-- 8. FIXED DEVBHAKTI FOOTER -->
        <div class="devbhakti-fixed-footer">
          <div class="footer-brand">
            <span>🕉️ DevBhakti</span>
          </div>
          <div class="footer-contacts">
            <div class="footer-contact-item">🌐 devbhakti.com</div>
            <div class="footer-contact-item">✉️ support@devbhakti.com</div>
            <div class="footer-contact-item">📞 +91 98195 23719</div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};
