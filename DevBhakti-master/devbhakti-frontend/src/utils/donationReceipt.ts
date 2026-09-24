import { parseLocalizedValue } from "./textUtils";

export interface DonationReceiptData {
  donorName: string;
  amount: number;
  platformFee?: number;
  mandalName: string;
  donationId: string;
  date: string;
  email?: string;
  phone?: string;
  message?: string;
  txnId: string;
}

export const generateDonationReceiptHTML = (donation: DonationReceiptData) => {
  const baseAmount = donation.amount || 0;
  const fee = donation.platformFee || 0;
  const totalAmount = baseAmount + fee;
  
  const rawMandalName = donation.mandalName || "Mandal";
  const mandalNameVal = parseLocalizedValue(rawMandalName) || "Mandal";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Donation Receipt - ${donation.donationId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; padding: 30px; }
        .receipt-card {
          max-width: 680px;
          margin: 0 auto;
          border: 2px solid #7c4624;
          border-radius: 20px;
          padding: 36px;
          background: #fffdf9;
          position: relative;
          box-shadow: 0 10px 30px rgba(124,70,36,0.08);
        }
        .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
        .om { font-size: 32px; color: #7c4624; font-weight: bold; margin-bottom: 6px; }
        .brand-title { font-family: 'Cinzel', serif; font-size: 26px; font-weight: 800; color: #7c4624; text-transform: uppercase; letter-spacing: 1px; }
        .mandal-subtitle { font-size: 16px; color: #64748b; font-weight: 600; margin-top: 4px; }
        .badge {
          display: inline-block;
          background: #7c4624;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 16px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 10px;
        }
        .receipt-id-box {
          background: #fdf6f0;
          border: 1px dashed #7c4624;
          border-radius: 14px;
          text-align: center;
          padding: 14px;
          margin-bottom: 24px;
        }
        .id-label { font-size: 11px; font-weight: 700; color: #7c4624; text-transform: uppercase; letter-spacing: 1px; }
        .id-value { font-size: 22px; font-weight: 800; color: #7c4624; letter-spacing: 1.5px; font-family: monospace; }
        .section-title { font-size: 13px; font-weight: 800; color: #7c4624; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px; }
        .item-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
        .item-value { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; word-break: break-all; }
        .amount-box {
          background: linear-gradient(135deg, #7c4624 0%, #5c3a21 100%);
          color: #fff;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin: 24px 0;
          box-shadow: 0 6px 20px rgba(124,70,36,0.2);
        }
        .amount-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #fde68a; }
        .amount-val { font-size: 36px; font-weight: 900; margin: 4px 0; letter-spacing: 0.5px; color: #ffffff; }
        .amount-sub { font-size: 12px; color: #fef3c7; opacity: 0.9; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 18px; }
        .stamp {
          display: inline-block;
          margin-top: 10px;
          border: 1.5px solid #047857;
          color: #047857;
          font-weight: 800;
          font-size: 11px;
          padding: 3px 12px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        @media print {
          body { padding: 0; background: none; }
          .receipt-card { box-shadow: none; border-color: #7c4624; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="om">🕉️</div>
          <div class="brand-title">DEVBHAKTI</div>
          <div class="mandal-subtitle">Donation Receipt for ${mandalNameVal}</div>
          <div class="badge">OFFICIAL DONATION RECEIPT</div>
        </div>

        <div class="receipt-id-box">
          <div class="id-label">Donation Reference Number</div>
          <div class="id-value">${donation.donationId}</div>
        </div>

        <div class="section-title">Donor & Payment Summary</div>
        <div class="grid">
          <div>
            <div class="item-label">Donor Name</div>
            <div class="item-value">${donation.donorName}</div>
          </div>
          <div>
            <div class="item-label">Date & Time</div>
            <div class="item-value">${donation.date}</div>
          </div>
          <div>
            <div class="item-label">Transaction ID</div>
            <div class="item-value" style="font-family: monospace;">${donation.txnId}</div>
          </div>
          <div>
            <div class="item-label">Receipt Email</div>
            <div class="item-value">${donation.email || "—"}</div>
          </div>
          ${donation.phone ? `
          <div>
            <div class="item-label">Phone Number</div>
            <div class="item-value">${donation.phone}</div>
          </div>` : ''}
          ${donation.message ? `
          <div>
            <div class="item-label">Message / Note</div>
            <div class="item-value" style="font-style: italic;">"${donation.message}"</div>
          </div>` : ''}
        </div>

        <div class="amount-box">
          <div class="amount-label">TOTAL CONTRIBUTION PAID</div>
          <div class="amount-val">₹ ${totalAmount.toLocaleString('en-IN')}</div>
          <div class="amount-sub">
            Base Donation: ₹${baseAmount.toLocaleString('en-IN')}${fee > 0 ? ` + Platform Support Fee: ₹${fee.toLocaleString('en-IN')}` : ''}
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your divine offering and generous contribution to ${mandalNameVal}. 🙏</p>
          <p style="margin-top: 4px;">This is a computer-generated official receipt issued by DevBhakti.</p>
          <div class="stamp">PAYMENT VERIFIED & CONFIRMED</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateReceiptHTML = (donation: any) => {
  return generateDonationReceiptHTML({
    donorName: donation.donorName || donation.name || "Devotee",
    amount: donation.amount || 0,
    platformFee: donation.platformFee || 0,
    mandalName: donation.mandalName || donation.templeName || "DevBhakti",
    donationId: donation.displayId || donation.donationId || donation.id || `DON-${Date.now().toString().slice(-6)}`,
    date: donation.createdAt ? new Date(donation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (donation.date || new Date().toLocaleDateString('en-IN')),
    email: donation.donorEmail || donation.email,
    phone: donation.donorPhone || donation.phone,
    message: donation.message,
    txnId: donation.transactionRef || donation.razorpayPaymentId || donation.txnId || donation.paymentId || "CONFIRMED"
  });
};

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

export const downloadDonationReceiptPDF = async (donation: DonationReceiptData) => {
  if (typeof window === "undefined") return;

  try {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const html = generateDonationReceiptHTML(donation);
    const cleanId = (donation.donationId || "Receipt").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `Donation_Receipt_${cleanId}.pdf`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const container = document.createElement('div');
    container.className = 'donation-pdf-container-root';
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
    const imagePromises = images.map(async img => {
      img.crossOrigin = "anonymous";
      if (img.src && !img.src.startsWith('data:')) {
        const base64 = await urlToBase64(img.src);
        if (base64 && base64.startsWith('data:')) {
          img.src = base64;
        }
      }
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
    console.error("Donation PDF download failed:", err);
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
};
