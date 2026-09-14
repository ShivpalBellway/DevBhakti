import { sendWhatsAppMessage } from './whatsappService';
import { DailyReportData } from './dailyReportEngine';

export const sendDailyReportWhatsApp = async (
  recipientPhone: string,
  recipientName: string,
  data: DailyReportData,
  downloadUrl?: string
) => {
  if (!recipientPhone) return { success: false, error: 'No recipient phone provided' };

  const campaignName = process.env.AISENSY_DAILY_REPORT_CAMPAIGN || 'devbhakti_daily_activity_report_v1';
  const apiKey = process.env.AISENSY_API_KEY;

  // Format Dynamic Category Summary Text for Param 6
  const categoryLines: string[] = [];
  if (data.categoryBreakup.poojaSeva) {
    categoryLines.push(` POOJA & SEVA\n${data.categoryBreakup.poojaSeva.count} Bookings | ₹${data.categoryBreakup.poojaSeva.amount.toLocaleString('en-IN')}\n Online: ${data.categoryBreakup.poojaSeva.onlineCount} | ₹${data.categoryBreakup.poojaSeva.onlineAmount.toLocaleString('en-IN')}\n Counter: ${data.categoryBreakup.poojaSeva.counterCount} | ₹${data.categoryBreakup.poojaSeva.counterAmount.toLocaleString('en-IN')}`);
  }
  if (data.categoryBreakup.donations) {
    categoryLines.push(` DONATIONS\n${data.categoryBreakup.donations.count} Donations | ₹${data.categoryBreakup.donations.amount.toLocaleString('en-IN')}\n Online: ${data.categoryBreakup.donations.onlineCount} | ₹${data.categoryBreakup.donations.onlineAmount.toLocaleString('en-IN')}\n Counter: ${data.categoryBreakup.donations.counterCount} | ₹${data.categoryBreakup.donations.counterAmount.toLocaleString('en-IN')}`);
  }
  if (data.categoryBreakup.sacredItems) {
    categoryLines.push(` SACRED ITEMS\n${data.categoryBreakup.sacredItems.count} Orders | ₹${data.categoryBreakup.sacredItems.amount.toLocaleString('en-IN')}\n Online: ${data.categoryBreakup.sacredItems.onlineCount} | ₹${data.categoryBreakup.sacredItems.onlineAmount.toLocaleString('en-IN')}\n Counter: ${data.categoryBreakup.sacredItems.counterCount} | ₹${data.categoryBreakup.sacredItems.counterAmount.toLocaleString('en-IN')}`);
  }
  if (data.categoryBreakup.ticketing) {
    categoryLines.push(` TICKETING\n${data.categoryBreakup.ticketing.count} Tickets | ₹${data.categoryBreakup.ticketing.amount.toLocaleString('en-IN')}\n Online: ${data.categoryBreakup.ticketing.onlineCount} | ₹${data.categoryBreakup.ticketing.onlineAmount.toLocaleString('en-IN')}\n Counter: ${data.categoryBreakup.ticketing.counterCount} | ₹${data.categoryBreakup.ticketing.counterAmount.toLocaleString('en-IN')}`);
  }

  const categorySummaryText = categoryLines.join('\n━━━━━━━━━━━━━━\n');

  // Format Today's Upcoming Pooja Text for Param 7
  const upcomingLines = data.upcomingPoojaSeva.items.length > 0
    ? data.upcomingPoojaSeva.items.map(i => `• ${i.name} — ${i.count}`).join('\n')
    : 'No bookings scheduled for today';

  const upcomingText = ` ${data.upcomingPoojaSeva.targetDateFormatted} | ${data.upcomingPoojaSeva.totalBookings} Bookings\n${upcomingLines}`;

  // Payment Mode Text for Param 8
  const paymentText = `UPI — ₹${data.paymentModeSummary.upi.toLocaleString('en-IN')}\nCash — ₹${data.paymentModeSummary.cash.toLocaleString('en-IN')}\nCard — ₹${data.paymentModeSummary.card.toLocaleString('en-IN')}`;

  // Exception Text for Param 9
  const exceptionText = data.exceptions.summaryText;

  // Parameters Array for AiSensy Template:
  // {{1}}: Entity Name
  // {{2}}: Reporting Period Header
  // {{3}}: Total Activity Line
  // {{4}}: Online Split Line
  // {{5}}: Counter Split Line
  // {{6}}: Category Summary Text
  // {{7}}: Today's Upcoming Pooja Text
  // {{8}}: Payment Mode Summary
  // {{9}}: Exceptions Summary
  // {{10}}: Download Link
  const params = [
    data.entityName,
    data.reportingPeriodHeader,
    `${data.overallSummary.totalTransactions} Transactions | ₹${data.overallSummary.totalCollection.toLocaleString('en-IN')}`,
    `${data.overallSummary.onlineCount} | ₹${data.overallSummary.onlineAmount.toLocaleString('en-IN')}`,
    `${data.overallSummary.counterCount} | ₹${data.overallSummary.counterAmount.toLocaleString('en-IN')}`,
    categorySummaryText,
    upcomingText,
    paymentText,
    exceptionText,
    downloadUrl || 'https://devbhakti.com'
  ];

  if (!apiKey) {
    console.log(`[AiSensy Simulation] AISENSY_API_KEY missing. Simulated WhatsApp dispatch to ${recipientPhone}:`, {
      campaignName,
      params
    });
    return { success: true, simulated: true, params };
  }

  try {
    const resData = await sendWhatsAppMessage(recipientPhone, recipientName, campaignName, params);
    return { success: true, data: resData };
  } catch (error: any) {
    console.error('[AiSensy] Daily Report WhatsApp error:', error.message || error);
    return { success: false, error: error.message };
  }
};
