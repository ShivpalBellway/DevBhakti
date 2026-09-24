const fs = require('fs');

const b64Path = 'C:/Users/admin/Downloads/DevBhakti-master/DevBhakti-master/devbhakti-frontend/src/assets/logo_b64.txt';
const b64Data = fs.readFileSync(b64Path, 'utf8').trim();

const frontendFile = 'C:/Users/admin/Downloads/DevBhakti-master/DevBhakti-master/devbhakti-frontend/src/utils/mandalReceiptTemplate.ts';
const backendFile = 'C:/Users/admin/Downloads/DevBhakti-master/DevBhakti-master/devbhakti-backend/src/utils/mandalReceiptTemplate.ts';

function buildTemplateContent(isFrontend) {
  const importLine = isFrontend ? 'import { parseLocalizedValue } from "./textUtils";\n\n' : '';
  return `${importLine}const DEVBHAKTI_LOGO_BASE64 = "${b64Data}";

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
  mandalId?: string;
  headerBanner?: string | null;
  sponsors?: SponsorBanner[];
  items: ReceiptItem[];
  totalAmount: number;
  customThankYouNote?: string;
  devoteeName?: string;
  devoteePhone?: string;
}

export const generateMandalReceiptHTML = (data: MandalReceiptData) => {
  ${isFrontend ? `const rawMandalName = data.mandalName || "Mandal / Temple";
  const mandalName = parseLocalizedValue(rawMandalName) || "Mandal / Temple";` : `const mandalName = data.mandalName || "Mandal / Temple";`}
  const address = data.mandalAddress || "India";
  const slugOrId = data.mandalSlug || data.mandalId || "mandal";
  const mandalPageUrl = \`devbhakti.com/mandals/\${slugOrId}\`;
  const fullMandalUrl = \`https://devbhakti.com/mandals/\${slugOrId}\`;

  // Helper to ensure clean display IDs instead of raw long CUIDs
  const formatCleanId = (idStr?: string) => {
    if (!idStr) return '—';
    if (idStr.length > 20 && idStr.startsWith('c')) {
      return \`REC-\${idStr.slice(-8).toUpperCase()}\`;
    }
    return idStr;
  };

  const displayReceiptNo = formatCleanId(data.receiptNo);
  const displayTxnId = formatCleanId(data.transactionId);

  // QR Code generator pointing to Mandal Detail Page
  const qrCodeUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=\${encodeURIComponent(fullMandalUrl)}\`;

  // Minimum 5 items in table
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

  return \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Receipt - \${displayReceiptNo}</title>
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
          min-height: 150px;
          max-height: 220px;
          overflow: hidden;
          background: #7b4623;
        }
        .header-banner-img {
          width: 100%;
          height: auto;
          min-height: 150px;
          max-height: 220px;
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
        .thankyou-heading {
          font-size: 14px;
          font-weight: 800;
          color: #7b4623;
          margin-top: 4px;
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
          width: 85px;
          height: 85px;
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

        /* 7. Sponsor Section */
        .sponsor-container {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          margin-top: 16px;
          text-align: center;
        }
        .sponsor-header-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 700;
          color: #7b4623;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 14px;
        }
        .sponsor-header-line {
          flex: 1;
          height: 1px;
          background: #e2d7c9;
        }
        .sponsor-strips-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sponsor-strip-img {
          width: 100%;
          min-height: 90px;
          max-height: 130px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          display: block;
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
        \${data.headerBanner ? \`
          <div class="header-banner-container">
            <img src="\${data.headerBanner}" class="header-banner-img" alt="\${mandalName} Banner" />
          </div>
        \` : \`
          <div class="text-header-box">
            <div class="text-header-title">\${mandalName}</div>
            <div class="text-header-address">\${address}</div>
            <div class="header-om-icon">🪔 🕉️ 🪔</div>
          </div>
        \`}

        <div class="receipt-body">
          
          <!-- 2. RECEIPT FOR -->
          \${data.headerBanner ? \`
            <div style="margin-bottom: 14px;">
              <div class="receipt-for-label">Receipt for</div>
              <div class="receipt-mandal-title">\${mandalName}</div>
              <div class="receipt-mandal-address">\${address}</div>
            </div>
          \` : ''}

          <!-- 3. DETAILS BLOCK WITH PROMINENT LOGO & CLEAN DISPLAY IDs -->
          <div class="details-grid">
            <table class="details-left-table">
              \${data.devoteeName ? \`
                <tr>
                  <td class="detail-label">Devotee Name</td>
                  <td>: <span class="detail-val" style="font-family: inherit; color: #0f172a; text-transform: capitalize;">\${data.devoteeName}</span></td>
                </tr>
              \` : ''}
              \${data.devoteePhone ? \`
                <tr>
                  <td class="detail-label">Devotee Phone</td>
                  <td>: <span class="detail-val">\${data.devoteePhone}</span></td>
                </tr>
              \` : ''}
              <tr>
                <td class="detail-label">📄 Receipt No.</td>
                <td>: <span class="detail-val">\${displayReceiptNo}</span></td>
              </tr>
              <tr>
                <td class="detail-label">📅 Date & Time</td>
                <td>: <span class="detail-val">\${data.dateTime}</span></td>
              </tr>
              <tr>
                <td class="detail-label">💳 Payment Mode</td>
                <td>: <span class="detail-val">\${data.paymentMode}</span></td>
              </tr>
              <tr>
                <td class="detail-label"># Transaction ID</td>
                <td>: <span class="detail-val">\${displayTxnId}</span></td>
              </tr>
            </table>

            <div class="powered-by-box" style="display: flex; align-items: center; gap: 12px; border-left: 2px solid #e2d7c9; padding-left: 16px; margin-left: 16px;">
              <img src="\${DEVBHAKTI_LOGO_BASE64}" style="height: 56px; width: auto; object-fit: contain; display: block;" alt="DevBhakti Logo" />
              <div style="text-align: left;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px;">POWERED BY</div>
                <div style="font-family: 'Cinzel', 'Georgia', serif; font-size: 18px; font-weight: 800; color: #582b0c; line-height: 1.1;">DevBhakti</div>
                <div style="font-size: 10px; color: #78716c; font-weight: 600; letter-spacing: 0.2px;">Connecting Devotion</div>
              </div>
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
              \${displayItems.map((item) => \`
                <tr>
                  <td class="num-col">\${item.srNo}</td>
                  <td>\${item.description || '—'}</td>
                  <td class="num-col">\${item.amount > 0 ? (item.quantity || 1) : '—'}</td>
                  <td class="amount-col">\${item.amount > 0 ? item.amount.toLocaleString('en-IN') : '—'}</td>
                </tr>
              \`).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right; padding-right: 14px;">Total Amount</td>
                <td class="amount-col total-amount-val">₹ \${data.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <!-- 5. THANK YOU & QR SECTION (PURE THEME BROWN #7b4623 FOLDED HANDS ICON & LOTUS) -->
          <div class="bottom-flex-block">
            <div class="thankyou-left">
              <div style="margin-bottom: 4px; text-align: center;">
                <svg width="44" height="44" viewBox="0 0 64 64" style="display: block; margin: 0 auto;">
                  <g fill="#7b4623">
                    <circle cx="22" cy="51" r="5.5" fill="#582b0c"/>
                    <circle cx="42" cy="51" r="5.5" fill="#582b0c"/>
                    <path d="M32 6C32 6 24 19 19 29C16.5 34 15.5 38 15.5 42C15.5 47 19.5 51 24.5 51C27.5 51 29.5 49 32 46.5V6Z" fill="#7b4623"/>
                    <path d="M32 6C32 6 40 19 45 29C47.5 34 48.5 38 48.5 42C48.5 47 44.5 51 39.5 51C36.5 51 34.5 49 32 46.5V6Z" fill="#7b4623"/>
                    <path d="M32 6V47" stroke="#3d1b06" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M21 35C18.5 38.5 18.5 42.5 21 45.5" stroke="#3d1b06" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M43 35C45.5 38.5 45.5 42.5 43 45.5" stroke="#3d1b06" stroke-width="2.5" stroke-linecap="round"/>
                  </g>
                </svg>
              </div>
              <div class="thankyou-heading">Thank you for your generous contribution!</div>
              <div class="thankyou-sub">\${data.customThankYouNote || "Your support helps us continue our seva and keep our traditions alive."}</div>
              <div style="margin-top: 6px; text-align: center;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#7b4623" style="display: inline-block;">
                  <path d="M12 3c-1.5 3-4 6-8 7 3 2 6 2 8 7 2-5 5-5 8-7-4-1-6.5-4-8-7z"/>
                </svg>
              </div>
            </div>
            <div class="qr-right">
              <div class="qr-label">Scan to visit our Mandal page</div>
              <img src="\${qrCodeUrl}" class="qr-img" alt="Mandal Page QR Code" />
              <div class="qr-url-text">\${mandalPageUrl}</div>
            </div>
          </div>

          <!-- 6. NOTES SECTION -->
          <div class="notes-box">
            <div style="font-weight: 700; color: #334155; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#7b4623"><circle cx="12" cy="12" r="10" fill="#7b4623"/><text x="12" y="16" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">i</text></svg>
              <span>Notes:</span>
            </div>
            1. This is a system generated receipt for your contribution to \${mandalName}.<br/>
            2. For any queries, please contact the Mandal.
          </div>

          <!-- 7. SPONSOR SECTION (OPTIONAL WITH SIDE HORIZONTAL LINES) -->
          \${hasSponsors ? \`
            <div class="sponsor-container">
              <div class="sponsor-header-title">
                <span class="sponsor-header-line"></span>
                <span>Thank you to our esteemed sponsors</span>
                <span class="sponsor-header-line"></span>
              </div>
              <div class="sponsor-strips-wrapper">
                \${sponsors.map(sp => \`
                  <img src="\${sp.imageUrl}" class="sponsor-strip-img" alt="\${sp.name || 'Sponsor'}" />
                \`).join('')}
              </div>
            </div>
          \` : ''}

        </div>

        <!-- 8. FIXED DEVBHAKTI FOOTER WITH LOGO & BROWN CONTACT ICONS -->
        <div class="devbhakti-fixed-footer" style="background: #ffffff; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #475569;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <!-- Logo & Tagline -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="\${DEVBHAKTI_LOGO_BASE64}" style="height: 38px; width: auto; object-fit: contain;" alt="DevBhakti Logo" />
              <div style="text-align: left;">
                <div style="font-family: 'Cinzel', 'Georgia', serif; font-size: 15px; font-weight: 800; color: #582b0c; line-height: 1.1;">DevBhakti</div>
                <div style="font-size: 9px; color: #78716c; font-weight: 600;">Connecting Devotion</div>
              </div>
            </div>

            <div style="height: 24px; width: 1px; background: #e2e8f0;"></div>

            <!-- Contact 1: Website -->
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #334155;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7b4623" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/></svg>
              <span>devbhakti.com</span>
            </div>

            <div style="height: 24px; width: 1px; background: #e2e8f0;"></div>

            <!-- Contact 2: Email -->
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #334155;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7b4623" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>support@devbhakti.com</span>
            </div>

            <div style="height: 24px; width: 1px; background: #e2e8f0;"></div>

            <!-- Contact 3: Phone -->
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #334155;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7b4623" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>+91 98195 23719</span>
            </div>
          </div>
        </div>

      </div>
    </body>
    </html>
  \`;
};

${isFrontend ? `
const urlToBase64 = async (url: string): Promise<string> => {
  if (!url || typeof window === "undefined") return "";
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return url;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return url;
  }
};

export const downloadMandalReceiptPDF = async (data: MandalReceiptData) => {
  if (typeof window === "undefined") return;

  try {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const [headerBannerBase64, ...sponsorBase64s] = await Promise.all([
      data.headerBanner ? urlToBase64(data.headerBanner) : Promise.resolve(""),
      ...(data.sponsors || []).map(sp => sp.imageUrl ? urlToBase64(sp.imageUrl) : Promise.resolve(""))
    ]);

    const mandalSlug = data.mandalSlug || data.mandalName.toLowerCase().replace(/\\s+/g, '-');
    const mandalPageUrl = \`devbhakti.com/mandals/\${mandalSlug}\`;
    const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?data=\${encodeURIComponent(\`https://\${mandalPageUrl}\`)}&size=150x150\`;
    const qrBase64 = await urlToBase64(qrUrl);

    const preparedData: MandalReceiptData = {
      ...data,
      headerBanner: headerBannerBase64 || data.headerBanner,
      sponsors: (data.sponsors || []).map((sp, idx) => ({
        ...sp,
        imageUrl: sponsorBase64s[idx] || sp.imageUrl
      }))
    };

    const html = generateMandalReceiptHTML(preparedData);
    const finalHtml = qrBase64 ? html.replace(qrUrl, qrBase64) : html;

    const cleanId = (data.receiptNo || "Receipt").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = \`Mandal_Receipt_\${cleanId}.pdf\`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(finalHtml, 'text/html');

    const container = document.createElement('div');
    container.className = 'mandal-pdf-container-root';
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.zIndex = '999999';
    container.style.background = '#ffffff';
    container.style.color = '#1e293b';
    container.style.pointerEvents = 'none';
    container.style.boxSizing = 'border-box';

    const styles = doc.querySelectorAll('style');
    styles.forEach(s => container.appendChild(s.cloneNode(true)));

    Array.from(doc.body.childNodes).forEach(node => {
      container.appendChild(node.cloneNode(true));
    });

    document.body.appendChild(container);

    const opt = {
      margin: [6, 6, 6, 6],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const cleanup = () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };

    const images = Array.from(container.querySelectorAll('img'));
    const imagePromises = images.map(img => {
      img.crossOrigin = "anonymous";
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    await Promise.all(imagePromises);
    await new Promise(r => setTimeout(r, 200));

    await (html2pdf as any)().set(opt).from(container).save();
    cleanup();
  } catch (err) {
    console.error("PDF download failed:", err);
  }
};

export const openPrintPDFWindow = (html: string) => {
  if (typeof window === "undefined") return;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
};` : ''}
`;
}

fs.writeFileSync(frontendFile, buildTemplateContent(true), 'utf8');
console.log('Frontend template updated successfully!');

fs.writeFileSync(backendFile, buildTemplateContent(false), 'utf8');
console.log('Backend template updated successfully!');
