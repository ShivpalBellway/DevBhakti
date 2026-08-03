import React from "react";

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

export const generatePoojaReceiptHTML = (booking: PoojaReceiptProps["booking"], t: any) => {
    const date = new Date(booking.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const bookingDateFormatted = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; padding: 40px; }
                .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 8px; }
                .header { text-align: center; border-bottom: 2px solid #7c4624; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 28px; font-weight: bold; color: #7c4624; }
                .temple-name { font-size: 20px; color: #555; margin-top: 5px; }
                .receipt-title { font-size: 24px; font-weight: bold; margin: 20px 0; text-transform: uppercase; color: #7c4624; }
                .section { margin-bottom: 25px; }
                .section-title { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; color: #7c4624; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .item { margin-bottom: 10px; }
                .label { color: #666; font-size: 14px; }
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
                    <div class="logo">${t("common.logo_text") || "DEV BHAKTI"}</div>
                    <div class="temple-name">${booking.templeName}</div>
                </div>

                <div style="text-align: center;">
                    <div class="receipt-title">${t("profile.modal.receipt_download") || "Pooja Booking Receipt"}</div>
                </div>

                <div class="section">
                    <div class="section-title">${t("booking_client.booking_summary")}</div>
                    <div class="grid">
                        <div class="item">
                            <div class="label">${t("profile.modal.booking_id")}</div>
                            <div class="value">${booking.id}</div>
                        </div>
                        <div class="item">
                            <div class="label">${t("booking_client.summary_date")}</div>
                            <div class="value">${bookingDateFormatted}</div>
                        </div>
                        <div class="item">
                            <div class="label">${t("booking_client.summary_service")}</div>
                            <div class="value">${booking.poojaName}</div>
                        </div>
                        <div class="item">
                            <div class="label">${t("booking_client.summary_package")}</div>
                            <div class="value">${booking.packageName}</div>
                        </div>
                        <div class="item">
                            <div class="label">${t("profile.modal.status")}</div>
                            <div class="value" style="color: green;">${booking.status}</div>
                        </div>
                         <div class="item">
                            <div class="label">${t("profile.modal.purchased_at") || "Receipt Generated"}</div>
                            <div class="value">${date}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">${t("booking_client.devotee_info_title")}</div>
                    <div class="grid">
                        <div class="item">
                            <div class="label">${t("profile.modal.devotee_name")}</div>
                            <div class="value">${booking.devoteeName}</div>
                        </div>
                        <div class="item">
                            <div class="label">${t("profile.modal.phone")}</div>
                            <div class="value">${booking.devoteePhone}</div>
                        </div>
                        ${booking.devoteeEmail ? `
                        <div class="item">
                            <div class="label">${t("profile.modal.email") || "Email"}</div>
                            <div class="value">${booking.devoteeEmail}</div>
                        </div>` : ''}

                        ${booking.gothra ? `
                        <div class="item">
                            <div class="label">${t("profile.fields.gothra") || "Gothra"}</div>
                            <div class="value">${booking.gothra}</div>
                        </div>` : ''}
                        
                        ${booking.kuldevi ? `
                        <div class="item">
                            <div class="label">${t("profile.fields.kuldevi") || "Kuldevi"}</div>
                            <div class="value">${booking.kuldevi}</div>
                        </div>` : ''}
                        
                        ${booking.kuldevta ? `
                        <div class="item">
                            <div class="label">${t("profile.fields.kuldevta") || "Kuldevta"}</div>
                            <div class="value">${booking.kuldevta}</div>
                        </div>` : ''}
                        
                        ${booking.dob ? `
                        <div class="item">
                            <div class="label">${t("profile.fields.dob") || "Date of Birth"}</div>
                            <div class="value">${booking.dob}</div>
                        </div>` : ''}
                        
                        ${booking.anniversary ? `
                        <div class="item">
                            <div class="label">${t("profile.fields.anniversary") || "Anniversary"}</div>
                            <div class="value">${booking.anniversary}</div>
                        </div>` : ''}
                        
                        ${booking.nativePlace ? `
                        <div class="item">
                            <div class="label">${t("profile.fields.native_place") || "Native Place"}</div>
                            <div class="value">${booking.nativePlace}</div>
                        </div>` : ''}
                    </div>

                    ${booking.additionalDevotees && booking.additionalDevotees.length > 0 && booking.additionalDevotees.some(d => d.name) ? `
                    <div style="margin-top: 15px;">
                        <div class="label" style="margin-bottom: 5px;">${t("booking_client.add_devotee_title")}</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${booking.additionalDevotees
                .filter(d => d.name)
                .map((d, i) => `
                                <div style="background: #fdf6f0; border: 1px solid #7c462433; padding: 10px; border-radius: 4px; font-size: 14px; width: 100%;">
                                    <div style="color: #7c4624; font-weight: bold; margin-bottom: 5px;">${t("booking_client.devotee_label")} #${i + 2}: ${d.name}</div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px; color: #555;">
                                        ${d.gothra ? `<div><span style="font-weight: bold;">${t("profile.fields.gothra")}:</span> ${d.gothra}</div>` : ''}
                                        ${d.kuldevi ? `<div><span style="font-weight: bold;">${t("profile.fields.kuldevi")}:</span> ${d.kuldevi}</div>` : ''}
                                        ${d.kuldevta ? `<div><span style="font-weight: bold;">${t("profile.fields.kuldevta")}:</span> ${d.kuldevta}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="amount-box">
                    <div class="amount-label">${t("booking_client.summary_total")}</div>
                    <div class="amount-value">₹ ${booking.totalAmount.toLocaleString('en-IN')}</div>
                    <div style="margin-top: 10px; font-size: 14px; font-style: italic; color: #666;">
                        (Rupees ${numberToWords(booking.totalAmount)} Only)
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #7c4624;">
                        ${t("booking_client.summary_package_price") || "Package Price"}: ₹${booking.packagePrice} & ${t("booking_client.summary_platform_fee") || "Platform Fee"}: ₹${booking.platformFee}${booking.prasadTotal ? ` & Prasad: ₹${booking.prasadTotal}` : ''}
                    </div>
                </div>

                <div class="footer">
                    <p>${t("profile.modal.receipt_footer") || "This is a computer-generated receipt and does not require a physical signature."}</p>
                    <p>${t("profile.modal.thank_you") || "Thank you for choosing Dev Bhakti for your spiritual journey."}</p>
                    <p>&copy; ${new Date().getFullYear()} ${t("common.logo_text") || "Dev Bhakti"}. ${t("profile.modal.all_rights") || "All rights reserved."}</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

    const numStr = num.toString();

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

    return str.trim();
};
