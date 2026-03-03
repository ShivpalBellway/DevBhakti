import { sendEmail } from '../utils/sendEmail';

export interface BookingMailData {
    bookingId: string;
    devoteeName: string;
    devoteePhone: string;
    devoteeEmail?: string;
    poojaName: string;
    templeName: string;
    bookingDate: string;
    packageName: string;
    packagePrice: number;
    platformFee: number;
    totalAmount: number;
    status: string;
    createdAt?: string;
    gothra?: string;
    kuldevi?: string;
    kuldevta?: string;
    dob?: string;
    anniversary?: string;
    additionalDevotees?: { name: string; gothra: string; kuldevi: string; kuldevta: string }[];
}

const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

    const numStr = Math.floor(num).toString();
    if (numStr.length > 9) return 'Amount too large';

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

    return str.trim();
};

export const sendBookingReceiptEmail = async (data: BookingMailData) => {
    if (!data.devoteeEmail) return;

    const bookingDateFormatted = data.bookingDate;
    const amountInWords = numberToWords(data.totalAmount);
    const generatedDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }) : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const additionalDevoteesHtml = data.additionalDevotees && data.additionalDevotees.length > 0 && data.additionalDevotees.some(d => d.name)
        ? `
        <div style="margin-top: 25px; border-top: 2px solid #7c4624; padding-top: 15px;">
            <p style="color: #7c4624; font-weight: bold; margin-bottom: 15px; font-size: 15px; text-transform: uppercase;">Additional Devotee Details</p>
            ${data.additionalDevotees
            .filter(d => d.name)
            .map((d, i) => `
                <div style="background: #fdf6f0; border: 1px solid #7c462433; padding: 15px; border-radius: 8px; margin-bottom: 12px;">
                    <div style="color: #7c4624; font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #7c462411; padding-bottom: 5px;">Devotee #${i + 2}: ${d.name}</div>
                    <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 12px; color: #555;">
                        <tr>
                            <td style="padding: 2px 0;">${d.gothra ? `<strong>Gothra:</strong> ${d.gothra}` : ''}</td>
                            <td style="padding: 2px 0;">${d.kuldevi ? `<strong>Kuldevi:</strong> ${d.kuldevi}` : ''}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 2px 0;">${d.kuldevta ? `<strong>Kuldevta:</strong> ${d.kuldevta}` : ''}</td>
                        </tr>
                    </table>
                </div>
            `).join('')}
        </div>
        `
        : '';

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
                .grid { display: block; width: 100%; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                .label { color: #666; }
                .value { font-weight: 600; color: #333; }
                .amount-box { background: #fdf6f0; border: 1px solid #7c4624; padding: 25px 15px; text-align: center; border-radius: 10px; margin: 30px 0; }
                .amount-label { font-size: 12px; color: #7c4624; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px; }
                .amount-value { font-size: 32px; font-weight: bold; color: #7c4624; margin: 5px 0; }
                .amount-words { font-size: 13px; font-style: italic; color: #666; margin-top: 10px; }
                .footer { background: #f9f9f9; padding: 25px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">DEV BHAKTI</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Sacred Pooja Booking Receipt</p>
                </div>
                <div class="content">
                    <div class="section">
                        <div class="section-title">Booking Information</div>
                        <div class="info-row"><span class="label">Booking ID</span><span class="value">${data.bookingId}</span></div>
                        <div class="info-row"><span class="label">Temple</span><span class="value">${data.templeName}</span></div>
                        <div class="info-row"><span class="label">Pooja Service</span><span class="value">${data.poojaName}</span></div>
                        <div class="info-row"><span class="label">Package</span><span class="value">${data.packageName}</span></div>
                        <div class="info-row"><span class="label">Pooja Date</span><span class="value">${bookingDateFormatted}</span></div>
                        <div class="info-row"><span class="label">Generated On</span><span class="value">${generatedDate}</span></div>
                        <div class="info-row"><span class="label">Status</span><span class="value" style="color: #2e7d32;">${data.status}</span></div>
                    </div>

                    <div class="section">
                        <div class="section-title">Main Devotee Details</div>
                        <div class="info-row"><span class="label">Name</span><span class="value">${data.devoteeName}</span></div>
                        <div class="info-row"><span class="label">Phone</span><span class="value">${data.devoteePhone}</span></div>
                        ${data.devoteeEmail ? `<div class="info-row"><span class="label">Email</span><span class="value">${data.devoteeEmail}</span></div>` : ''}
                        
                        <!-- Spiritual Details -->
                        ${data.gothra ? `<div class="info-row"><span class="label">Gothra</span><span class="value">${data.gothra}</span></div>` : ''}
                        ${data.kuldevi ? `<div class="info-row"><span class="label">Kuldevi</span><span class="value">${data.kuldevi}</span></div>` : ''}
                        ${data.kuldevta ? `<div class="info-row"><span class="label">Kuldevta</span><span class="value">${data.kuldevta}</span></div>` : ''}
                        
                        <!-- Personal Dates -->
                        ${data.dob ? `<div class="info-row"><span class="label">Date of Birth</span><span class="value">${data.dob}</span></div>` : ''}
                        ${data.anniversary ? `<div class="info-row"><span class="label">Anniversary</span><span class="value">${data.anniversary}</span></div>` : ''}
                    </div>

                    ${additionalDevoteesHtml}

                    <div class="amount-box">
                        <div class="amount-label">Total Amount Paid</div>
                        <div class="amount-value">₹ ${data.totalAmount.toLocaleString('en-IN')}</div>
                        <div class="amount-words">(Rupees ${amountInWords} Only)</div>
                        <div style="margin-top: 15px; font-size: 11px; color: #7c462499;">
                            Package: ₹${data.packagePrice}  |  Platform Fee: ₹${data.platformFee}
                        </div>
                    </div>

                    <div style="margin-top: 30px; text-align: center; border-radius: 8px; padding: 15px; border-left: 4px solid #7c4624; background: #fdf6f0;">
                        <p style="margin: 0; font-size: 13px; font-style: italic; color: #7c4624;">
                            "May the divine blessings of ${data.templeName} bring peace, prosperity, and happiness to your life."
                        </p>
                    </div>
                </div>
                <div class="footer">
                    <p>This is a computer-generated confirmation and does not require a physical signature.</p>
                    <p>&copy; ${new Date().getFullYear()} Dev Bhakti. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(
        data.devoteeEmail,
        `Booking Confirmed: ${data.poojaName} - Dev Bhakti`,
        `Your sacred pooja booking ${data.bookingId} at ${data.templeName} has been confirmed. Total amount paid: ₹${data.totalAmount}.`,
        html
    );
};
