import React from "react";
import { parseLocalizedValue } from "./textUtils";

interface PoojaReceiptProps {
    booking: {
        id: string;
        devoteeName: string;
        devoteePhone: string;
        devoteeEmail?: string;
        poojaName: string;
        templeName: string;
        bookingDate: string;
        packageName: string;
        packagePrice: number;
        platformFee: number;
        prasadTotal?: number;
        totalAmount: number;
        status: string;
        createdAt: string;
        gothra?: string;
        kuldevi?: string;
        kuldevta?: string;
        dob?: string;
        anniversary?: string;
        nativePlace?: string;
        additionalDevotees?: { name: string; gothra: string; kuldevi: string; kuldevta: string }[];
    };
}

const formatReceiptLabel = (translatedText: string | undefined, defaultText: string): string => {
    if (!translatedText || translatedText.includes('.')) return defaultText;
    // If translation key returns key-like lowercase strings like "logo text" or "booking summary"
    const lower = translatedText.toLowerCase().trim();
    if (lower === "logo text" || lower === "booking summary" || lower === "summary date" || lower === "summary service" || lower === "summary package" || lower === "devotee info title" || lower === "purchased at" || lower === "summary total") {
        return defaultText;
    }
    return translatedText;
};

export const generatePoojaReceiptHTML = (booking: PoojaReceiptProps["booking"], t: any) => {
    const rawTotal = booking?.totalAmount ?? (booking as any)?.amount ?? (booking as any)?.packagePrice ?? 0;
    const numericTotal = typeof rawTotal === 'number' ? rawTotal : (parseFloat(rawTotal) || 0);
    const formattedTotal = numericTotal.toLocaleString('en-IN');

    const rawPackagePrice = booking?.packagePrice ?? (booking as any)?.amount ?? numericTotal;
    const packagePriceVal = typeof rawPackagePrice === 'number' ? rawPackagePrice : (parseFloat(rawPackagePrice) || 0);

    const rawPlatformFee = booking?.platformFee ?? 0;
    const platformFeeVal = typeof rawPlatformFee === 'number' ? rawPlatformFee : (parseFloat(rawPlatformFee) || 0);

    const isPhotography = (booking as any)?.type === 'PHOTOGRAPHY' || !!(booking as any)?.timeSlot || (booking as any)?.poojaName?.toLowerCase().includes('photography');
    const rawPoojaName = booking?.poojaName || (booking as any)?.pooja?.name || (isPhotography ? "Pooja & Photography Service" : "Pooja Service");
    const rawTempleName = booking?.templeName || (booking as any)?.temple?.name || "DevBhakti";
    const rawPackageName = booking?.packageName || "Standard";

    let poojaNameVal = parseLocalizedValue(rawPoojaName);
    if (!poojaNameVal || poojaNameVal === "N/A" || poojaNameVal === "[object Object]") poojaNameVal = isPhotography ? "Pooja & Photography Service" : "Pooja Service";

    let templeNameVal = parseLocalizedValue(rawTempleName);
    if (!templeNameVal || templeNameVal === "N/A" || templeNameVal === "[object Object]") templeNameVal = "DevBhakti";

    let packageNameVal = parseLocalizedValue(rawPackageName);
    if (!packageNameVal || packageNameVal === "N/A" || packageNameVal === "[object Object]") packageNameVal = "Standard";

    const receiptTitle = isPhotography ? "PHOTOGRAPHY SERVICE RECEIPT" : "POOJA BOOKING RECEIPT";
    const serviceLabel = isPhotography ? "Photography Service" : "Pooja Service";

    const statusVal = booking?.status || "CONFIRMED";

    const createdDateObj = booking?.createdAt ? new Date(booking.createdAt) : new Date();
    const date = !isNaN(createdDateObj.getTime())
        ? createdDateObj.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : new Date().toLocaleDateString("en-IN");

    const rawBookingDate = booking?.bookingDate || (booking as any)?.date;
    const bookingDateObj = rawBookingDate ? new Date(rawBookingDate) : new Date();
    const bookingDateFormatted = !isNaN(bookingDateObj.getTime())
        ? bookingDateObj.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : new Date().toLocaleDateString("en-IN");

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; padding: 40px; }
                .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 8px; }
                .header { text-align: center; border-bottom: 2px solid #7c4624; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 28px; font-weight: bold; color: #7c4624; text-transform: uppercase; letter-spacing: 1px; }
                .temple-name { font-size: 20px; color: #555; margin-top: 5px; font-weight: 600; }
                .receipt-title { font-size: 24px; font-weight: bold; margin: 20px 0; text-transform: uppercase; color: #7c4624; }
                .section { margin-bottom: 25px; }
                .section-title { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; color: #7c4624; text-transform: capitalize; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .item { margin-bottom: 10px; }
                .label { color: #666; font-size: 14px; text-transform: capitalize; }
                .value { font-weight: 500; font-size: 16px; }
                .amount-box { background: #fdf6f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 1px solid #7c4624; }
                .amount-label { font-size: 14px; color: #7c4624; text-transform: uppercase; letter-spacing: 1px; }
                .amount-value { font-size: 32px; font-weight: bold; color: #7c4624; }
                .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                @media print {
                    body { padding: 0; }
                    .receipt-container { border: none; padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <div class="logo">DEV BHAKTI</div>
                    <div class="temple-name">${templeNameVal}</div>
                </div>

                <div style="text-align: center;">
                    <div class="receipt-title">${receiptTitle}</div>
                </div>

                <div class="section">
                    <div class="section-title">Booking Summary</div>
                    <div class="grid">
                        <div class="item">
                            <div class="label">Booking ID</div>
                            <div class="value">${booking?.id || 'N/A'}</div>
                        </div>
                        <div class="item">
                            <div class="label">Booking Date</div>
                            <div class="value">${bookingDateFormatted}</div>
                        </div>
                        <div class="item">
                            <div class="label">${serviceLabel}</div>
                            <div class="value">${poojaNameVal}</div>
                        </div>
                        <div class="item">
                            <div class="label">Package</div>
                            <div class="value">${packageNameVal}</div>
                        </div>
                        <div class="item">
                            <div class="label">Status</div>
                            <div class="value" style="color: green;">${statusVal}</div>
                        </div>
                         <div class="item">
                            <div class="label">Receipt Generated</div>
                            <div class="value">${date}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Devotee Details</div>
                    <div class="grid">
                        <div class="item">
                            <div class="label">Devotee Name</div>
                            <div class="value">${booking?.devoteeName || 'N/A'}</div>
                        </div>
                        <div class="item">
                            <div class="label">Phone Number</div>
                            <div class="value">${booking?.devoteePhone || 'N/A'}</div>
                        </div>
                        ${booking?.devoteeEmail ? `
                        <div class="item">
                            <div class="label">Email Address</div>
                            <div class="value">${booking.devoteeEmail}</div>
                        </div>` : ''}

                        ${booking?.gothra ? `
                        <div class="item">
                            <div class="label">Gothra</div>
                            <div class="value">${booking.gothra}</div>
                        </div>` : ''}
                        
                        ${booking?.kuldevi ? `
                        <div class="item">
                            <div class="label">Kuldevi</div>
                            <div class="value">${booking.kuldevi}</div>
                        </div>` : ''}
                        
                        ${booking?.kuldevta ? `
                        <div class="item">
                            <div class="label">Kuldevta</div>
                            <div class="value">${booking.kuldevta}</div>
                        </div>` : ''}
                        
                        ${booking?.dob ? `
                        <div class="item">
                            <div class="label">Date of Birth</div>
                            <div class="value">${booking.dob}</div>
                        </div>` : ''}
                        
                        ${booking?.anniversary ? `
                        <div class="item">
                            <div class="label">Anniversary</div>
                            <div class="value">${booking.anniversary}</div>
                        </div>` : ''}
                        
                        ${booking?.nativePlace ? `
                        <div class="item">
                            <div class="label">Native Place</div>
                            <div class="value">${booking.nativePlace}</div>
                        </div>` : ''}
                    </div>

                    ${booking?.additionalDevotees && booking.additionalDevotees.length > 0 && booking.additionalDevotees.some(d => d.name) ? `
                    <div style="margin-top: 15px;">
                        <div class="label" style="margin-bottom: 5px;">Additional Devotees</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${booking.additionalDevotees
                .filter(d => d.name)
                .map((d, i) => `
                                <div style="background: #fdf6f0; border: 1px solid #7c462433; padding: 10px; border-radius: 4px; font-size: 14px; width: 100%;">
                                    <div style="color: #7c4624; font-weight: bold; margin-bottom: 5px;">Devotee #${i + 2}: ${d.name}</div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px; color: #555;">
                                        ${d.gothra ? `<div><span style="font-weight: bold;">Gothra:</span> ${d.gothra}</div>` : ''}
                                        ${d.kuldevi ? `<div><span style="font-weight: bold;">Kuldevi:</span> ${d.kuldevi}</div>` : ''}
                                        ${d.kuldevta ? `<div><span style="font-weight: bold;">Kuldevta:</span> ${d.kuldevta}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="amount-box">
                    <div class="amount-label">TOTAL AMOUNT</div>
                    <div class="amount-value">₹ ${formattedTotal}</div>
                    <div style="margin-top: 10px; font-size: 14px; font-style: italic; color: #666;">
                        (Rupees ${numberToWords(numericTotal)} Only)
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #7c4624;">
                        Package Price: ₹${packagePriceVal} & Platform Fee: ₹${platformFeeVal}${booking?.prasadTotal ? ` & Prasad: ₹${booking.prasadTotal}` : ''}
                    </div>
                </div>

                <div class="footer">
                    <p>This is a computer-generated receipt and does not require a physical signature.</p>
                    <p>Thank you for choosing Dev Bhakti for your spiritual journey.</p>
                    <p>&copy; ${new Date().getFullYear()} Dev Bhakti. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
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

export const downloadPoojaReceiptPDF = (booking: PoojaReceiptProps["booking"], t?: any) => {
    const html = generatePoojaReceiptHTML(booking, t);
    const bookingId = booking?.id || 'booking';
    const fileName = `Pooja_Receipt_${bookingId}.pdf`;

    return new Promise<void>(async (resolve) => {
        try {
            const html2pdfModule = await import("html2pdf.js");
            const html2pdf = html2pdfModule.default || html2pdfModule;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const container = document.createElement('div');
            container.className = 'pooja-pdf-container-root';
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
                return new Promise((r) => {
                    img.onload = r;
                    img.onerror = r;
                });
            });

            await Promise.all(imagePromises);
            await new Promise(r => setTimeout(r, 200));

            await (html2pdf as any)().set(opt).from(container).save();
            cleanup();
            resolve();
        } catch (err) {
            console.error("Pooja PDF download error:", err);
            resolve();
        }
    });1
};



const fallbackToPrintWindow = (html: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};

const numberToWords = (num: number): string => {
    if (!num || isNaN(num) || num < 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

    const numStr = Math.floor(num).toString();

    if (numStr.length > 9) return 'overflow';

    const n = ('000000000' + numStr)
        .slice(-9)
        .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);

    if (!n) return '';

    let str = '';

    str += n[1] !== '00' ? (a[+n[1]] || (b[+n[1][0]] + a[+n[1][1]])) + 'Crore ' : '';
    str += n[2] !== '00' ? (a[+n[2]] || (b[+n[2][0]] + a[+n[2][1]])) + 'Lakh ' : '';
    str += n[3] !== '00' ? (a[+n[3]] || (b[+n[3][0]] + a[+n[3][1]])) + 'Thousand ' : '';
    str += n[4] !== '0' ? (a[+n[4]] || (b[+n[4][0]] + a[+n[4][1]])) + 'Hundred ' : '';
    str += n[5] !== '00'
        ? ((str !== '') ? 'and ' : '') + (a[+n[5]] || (b[+n[5][0]] + a[+n[5][1]]))
        : '';

    return str.trim() || 'Zero';
};
