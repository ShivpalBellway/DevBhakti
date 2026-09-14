import { sendEmail } from '../utils/sendEmail';
import { DailyReportData } from './dailyReportEngine';

export const sendDailyReportEmail = async (
  recipientEmail: string,
  data: DailyReportData,
  pdfUrl?: string
) => {
  if (!recipientEmail) return { success: false, error: 'No recipient email provided' };

  const subject = `DevBhakti Daily Activity Report | ${data.entityName} | ${data.reportDate}`;

  // Formatted HTML Table cells for Category Breakup: Amount / Transactions
  const renderCategoryRow = (label: string, categoryData?: any) => {
    if (!categoryData) return '';
    const onlineStr = `₹${categoryData.onlineAmount.toLocaleString('en-IN')} / ${categoryData.onlineCount}`;
    const counterStr = `₹${categoryData.counterAmount.toLocaleString('en-IN')} / ${categoryData.counterCount}`;
    const totalStr = `₹${categoryData.amount.toLocaleString('en-IN')} / ${categoryData.count}`;
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 600; color: #5d2e0b;">${label}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${onlineStr}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${counterStr}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: 700; color: #333;">${totalStr}</td>
      </tr>
    `;
  };

  const poojaRow = renderCategoryRow('Pooja & Seva', data.categoryBreakup.poojaSeva);
  const donationRow = renderCategoryRow('Donations', data.categoryBreakup.donations);
  const sacredItemsRow = renderCategoryRow('Sacred Items', data.categoryBreakup.sacredItems);
  const ticketingRow = renderCategoryRow('Ticketing', data.categoryBreakup.ticketing);

  const totalOnlineStr = `₹${data.overallSummary.onlineAmount.toLocaleString('en-IN')} / ${data.overallSummary.onlineCount}`;
  const totalCounterStr = `₹${data.overallSummary.counterAmount.toLocaleString('en-IN')} / ${data.overallSummary.counterCount}`;
  const totalOverallStr = `₹${data.overallSummary.totalCollection.toLocaleString('en-IN')} / ${data.overallSummary.totalTransactions}`;

  // Upcoming Pooja List
  const upcomingHtml = data.upcomingPoojaSeva.items.length > 0
    ? `
      <div style="margin-top: 25px; background: #fff8f3; border: 1px solid #e0c0a8; border-radius: 6px; padding: 20px;">
        <h3 style="margin-top: 0; color: #7c4624; font-size: 16px;"> Today's Pooja & Seva — ${data.upcomingPoojaSeva.targetDateFormatted} (${data.upcomingPoojaSeva.totalBookings} Bookings)</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
          <tr style="background: #f0dfd0; font-weight: bold; color: #5d2e0b;">
            <td style="padding: 8px 12px;">Pooja / Seva</td>
            <td style="padding: 8px 12px; text-align: right;">Bookings</td>
          </tr>
          ${data.upcomingPoojaSeva.items.map(item => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f2e2d5;">${item.name}</td>
              <td style="padding: 8px 12px; text-align: right; border-bottom: 1px solid #f2e2d5; font-weight: bold;">${item.count}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold; background: #faf0e8;">
            <td style="padding: 8px 12px;">Total</td>
            <td style="padding: 8px 12px; text-align: right;">${data.upcomingPoojaSeva.totalBookings}</td>
          </tr>
        </table>
      </div>
    `
    : '';

  // Sacred Items Revenue Table
  const sacredItemsHtml = data.sacredItemsSummary.items.length > 0
    ? `
      <div style="margin-top: 25px;">
        <h3 style="margin-bottom: 8px; color: #7c4624; font-size: 16px;"> Sacred Items / Prasad (${data.sacredItemsSummary.totalQtySold} Sold | ₹${data.sacredItemsSummary.totalRevenue.toLocaleString('en-IN')})</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; border-collapse: collapse;">
          <tr style="background: #f7f7f7; font-weight: bold;">
            <td style="padding: 8px; border: 1px solid #ddd;">Item</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty Sold</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Revenue</td>
          </tr>
          ${data.sacredItemsSummary.items.map(i => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${i.name}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i.qtySold}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: 600;">₹${i.revenue.toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
    : '';

  // Donations Breakdown Table
  const donationHtml = data.donationSummary.purposes.length > 0
    ? `
      <div style="margin-top: 25px;">
        <h3 style="margin-bottom: 8px; color: #7c4624; font-size: 16px;"> Donations Breakdown (${data.donationSummary.totalDonationsCount} Donations | ₹${data.donationSummary.totalDonationAmount.toLocaleString('en-IN')})</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; border-collapse: collapse;">
          <tr style="background: #f7f7f7; font-weight: bold;">
            <td style="padding: 8px; border: 1px solid #ddd;">Purpose</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Amount</td>
          </tr>
          ${data.donationSummary.purposes.map(p => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${p.purpose}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: 600;">₹${p.amount.toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
    : '';

  // Attention Warning Banner
  const exceptionBg = data.exceptions.hasExceptions ? '#fff3cd' : '#e8f5e9';
  const exceptionBorder = data.exceptions.hasExceptions ? '#ffeeba' : '#c3e6cb';
  const exceptionColor = data.exceptions.hasExceptions ? '#856404' : '#155724';

  const downloadLink = pdfUrl || '#';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DevBhakti Daily Activity Report</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #7c4624; padding-bottom: 15px; margin-bottom: 20px; }
        .header h2 { color: #5d2e0b; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .header h4 { color: #7c4624; margin: 5px 0 0 0; font-size: 16px; }
        .period-box { background: #fdf6f0; border-radius: 6px; padding: 12px; text-align: center; font-size: 13px; color: #666; margin-bottom: 25px; border: 1px solid #e8d0bc; }
        .summary-header { background: #5d2e0b; color: #ffffff; padding: 14px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 20px; }
        .table-custom { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
        .table-custom th { background: #f7f7f7; color: #555; padding: 10px; border-bottom: 2px solid #ddd; text-align: center; }
        .btn { display: inline-block; background-color: #7c4624; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; margin-right: 10px; margin-top: 15px; }
        .footer { font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2> DevBhakti Daily Activity Report</h2>
          <h4>${data.entityName}</h4>
        </div>

        <div class="period-box">
          <strong>Reporting Period:</strong> ${data.reportingPeriodHeader}<br>
          <span style="font-size: 12px; color: #888;">Generated: ${data.generatedAtFormatted}</span>
        </div>

        <div class="summary-header">
          Yesterday's Summary: ${data.overallSummary.totalTransactions} Transactions | ₹${data.overallSummary.totalCollection.toLocaleString('en-IN')} Total Collection
        </div>

        <table class="table-custom">
          <thead>
            <tr>
              <th style="text-align: left;">Category</th>
              <th>Online</th>
              <th>Counter</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${poojaRow}
            ${donationRow}
            ${sacredItemsRow}
            ${ticketingRow}
            <tr style="background: #fdf6f0; font-weight: bold;">
              <td style="padding: 10px; border-top: 2px solid #7c4624; color: #5d2e0b;">TOTAL</td>
              <td style="padding: 10px; border-top: 2px solid #7c4624; text-align: center;">${totalOnlineStr}</td>
              <td style="padding: 10px; border-top: 2px solid #7c4624; text-align: center;">${totalCounterStr}</td>
              <td style="padding: 10px; border-top: 2px solid #7c4624; text-align: center; color: #5d2e0b;">${totalOverallStr}</td>
            </tr>
          </tbody>
        </table>

        ${upcomingHtml}
        ${sacredItemsHtml}
        ${donationHtml}

        <div style="margin-top: 25px; background: #fafafa; padding: 15px; border-radius: 6px; font-size: 14px;">
          <h4 style="margin: 0 0 8px 0; color: #5d2e0b;"> Payment Mode Summary</h4>
          <strong>UPI:</strong> ₹${data.paymentModeSummary.upi.toLocaleString('en-IN')} &nbsp;|&nbsp;
          <strong>Cash:</strong> ₹${data.paymentModeSummary.cash.toLocaleString('en-IN')} &nbsp;|&nbsp;
          <strong>Card:</strong> ₹${data.paymentModeSummary.card.toLocaleString('en-IN')} &nbsp;|&nbsp;
          <strong>Other:</strong> ₹${data.paymentModeSummary.other.toLocaleString('en-IN')}
        </div>

        <div style="margin-top: 20px; background: ${exceptionBg}; border: 1px solid ${exceptionBorder}; color: ${exceptionColor}; padding: 14px; border-radius: 6px; font-size: 14px;">
          <strong> Attention Required:</strong> ${data.exceptions.summaryText}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${downloadLink}" class="btn"> Download Full Report PDF</a>
        </div>

        <div class="footer">
          All amounts are in INR (₹). This report is automatically generated by DevBhakti.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(
    recipientEmail,
    subject,
    `DevBhakti Daily Activity Report for ${data.entityName}. Total Collection: ₹${data.overallSummary.totalCollection} (${data.overallSummary.totalTransactions} transactions).`,
    html
  );
};
