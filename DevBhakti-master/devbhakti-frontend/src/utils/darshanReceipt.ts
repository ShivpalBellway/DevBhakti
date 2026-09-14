import { parseLocalizedValue, formatSlotTime } from "./textUtils";

interface DarshanReceiptData {
  displayId?: string;
  id?: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  visitorCount: number;
  totalAmount: number;
  paymentMode?: string;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  slot?: {
    date?: string;
    startTime?: string;
    endTime?: string;
  };
  templeName?: string;
  mandalName?: string;
  ticketType?: string;
}

export const generateDarshanReceiptHTML = (data: DarshanReceiptData) => {
  const rawName = data.templeName || data.mandalName || "DevBhakti";
  const entityName = parseLocalizedValue(rawName) || "DevBhakti";
  const ticketId = data.displayId || data.id || `TK-${Date.now().toString().slice(-6)}`;
  
  const darshanDateStr = data.slot?.date
    ? new Date(data.slot.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const bookingDateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  
  const slotTime = (data.slot?.startTime && data.slot?.endTime)
    ? `${formatSlotTime(data.slot.startTime)} - ${formatSlotTime(data.slot.endTime)}`
    : "General Slot";

  const totalAmount = data.totalAmount ?? 0;
  const passType = (data.ticketType || "GENERAL_DARSHAN").replace(/_/g, " ");
  const paymentMethod = (data.paymentMethod || data.paymentMode || "CASH").toUpperCase();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Darshan Pass - ${ticketId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; padding: 24px; }
        .ticket-card {
          max-width: 580px;
          margin: 0 auto;
          border: 2px dashed #7c4624;
          border-radius: 16px;
          padding: 28px;
          background: #fffdf9;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
        .om { font-size: 26px; color: #7c4624; font-weight: bold; margin-bottom: 4px; }
        .entity-title { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #7c4624; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge {
          display: inline-block;
          background: #7c4624;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 8px;
        }
        .ticket-id-box {
          background: #fdf6f0;
          border: 1px solid #7c462433;
          border-radius: 12px;
          text-align: center;
          padding: 12px;
          margin-bottom: 20px;
        }
        .id-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .id-value { font-size: 24px; font-weight: 800; color: #7c4624; letter-spacing: 1.5px; font-family: monospace; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .field-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
        .field-value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
        .highlight { color: #047857; }
        .footer-box {
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
          text-align: center;
          font-size: 11px;
          color: #64748b;
        }
        .stamp {
          margin-top: 12px;
          display: inline-block;
          border: 1.5px solid #047857;
          color: #047857;
          padding: 2px 10px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
        }
        @media print {
          body { padding: 0; background: none; }
          .ticket-card { box-shadow: none; border-color: #000; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="ticket-card">
        <div class="header">
          <div class="om">🕉️</div>
          <div class="entity-title">${entityName}</div>
          <div class="badge">COUNTER ENTRY PASS</div>
        </div>

        <div class="ticket-id-box">
          <div class="id-label">Pass ID / Entry Token</div>
          <div class="id-value">${ticketId}</div>
        </div>

        <div class="grid">
          <div>
            <div class="field-label">Devotee Name</div>
            <div class="field-value">${data.visitorName}</div>
          </div>
          <div>
            <div class="field-label">Mobile Number</div>
            <div class="field-value">${data.visitorPhone}</div>
          </div>
          <div>
            <div class="field-label">Total Visitors</div>
            <div class="field-value highlight">${data.visitorCount} Person(s)</div>
          </div>
          <div>
            <div class="field-label">Pass Type</div>
            <div class="field-value">${passType}</div>
          </div>
          <div>
            <div class="field-label">Booking Issue Date</div>
            <div class="field-value">${bookingDateStr}</div>
          </div>
          <div>
            <div class="field-label">Darshan Visit Date</div>
            <div class="field-value">${darshanDateStr}</div>
          </div>
          <div>
            <div class="field-label">Slot Time</div>
            <div class="field-value">${slotTime}</div>
          </div>
          <div>
            <div class="field-label">Payment Mode</div>
            <div class="field-value">${paymentMethod}</div>
          </div>
          <div>
            <div class="field-label">Amount Paid</div>
            <div class="field-value" style="color: #7c4624;">₹${totalAmount}</div>
          </div>
        </div>

        <div class="footer-box">
          <p>Please present this physical pass at the Darshan Entry Counter.</p>
          <div class="stamp">VALID FOR ONE TIME ENTRY ONLY</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        };
      </script>
    </body>
    </html>
  `;
};

export const printDarshanPassReceipt = (data: DarshanReceiptData) => {
  const html = generateDarshanReceiptHTML(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
