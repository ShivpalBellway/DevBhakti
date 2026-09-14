import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { DailyReportData } from './dailyReportEngine';

export const generateDailyReportPDF = async (reportData: DailyReportData): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure storage directory exists
      const yearMonth = reportData.reportDate.substring(0, 7);
      const dirPath = path.join(__dirname, '../../uploads/reports/daily', yearMonth);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const fileName = `${reportData.entityType.toLowerCase()}_${reportData.entityId}_${reportData.reportDate}.pdf`;
      const filePath = path.join(dirPath, fileName);
      const writeStream = fs.createWriteStream(filePath);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(writeStream);

      // Colors
      const primaryColor = '#5d2e0b';
      const secondaryColor = '#7c4624';
      const lightBg = '#fdf6f0';
      const textColor = '#333333';
      const borderColor = '#dcb386';

      // Header Banner
      doc.rect(40, 40, 515, 65).fill(lightBg);
      doc.rect(40, 40, 515, 65).stroke(borderColor);

      doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('DEVBHAKTI DAILY ACTIVITY REPORT', 55, 52, { characterSpacing: 1 });
      doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text(reportData.entityName, 55, 76);

      doc.fillColor('#666666').fontSize(9).font('Helvetica').text(`Reporting Period: ${reportData.reportingPeriodHeader}`, 320, 55, { align: 'right' });
      doc.text(`Generated: ${reportData.generatedAtFormatted}`, 320, 70, { align: 'right' });

      let y = 120;

      // Section A: Overall Summary
      doc.fillColor(secondaryColor).fontSize(13).font('Helvetica-Bold').text("YESTERDAY'S SUMMARY", 40, y);
      doc.strokeColor(secondaryColor).lineWidth(1).moveTo(40, y + 16).lineTo(555, y + 16).stroke();
      y += 25;

      // Highlight Box
      doc.rect(40, y, 515, 45).fill('#f7f7f7').stroke('#e0e0e0');
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(`${reportData.overallSummary.totalTransactions} Transactions`, 60, y + 14);
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(`Total Collection: ₹${reportData.overallSummary.totalCollection.toLocaleString('en-IN')}`, 280, y + 14, { align: 'right' });
      y += 55;

      // Summary Table Headers
      doc.rect(40, y, 515, 20).fill(secondaryColor);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('Channel', 50, y + 5);
      doc.text('Transactions', 220, y + 5, { align: 'center' });
      doc.text('Total Amount (INR)', 400, y + 5, { align: 'right' });
      y += 20;

      // Table Rows
      const rows = [
        { label: 'Online Activity', count: reportData.overallSummary.onlineCount, amount: reportData.overallSummary.onlineAmount },
        { label: 'Counter / Offline Activity', count: reportData.overallSummary.counterCount, amount: reportData.overallSummary.counterAmount },
        { label: 'TOTAL', count: reportData.overallSummary.totalTransactions, amount: reportData.overallSummary.totalCollection, isTotal: true }
      ];

      rows.forEach((r, idx) => {
        const bg = r.isTotal ? lightBg : (idx % 2 === 0 ? '#ffffff' : '#fcfcfc');
        doc.rect(40, y, 515, 20).fill(bg).stroke('#eeeeee');
        doc.fillColor(r.isTotal ? primaryColor : textColor).fontSize(9).font(r.isTotal ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(r.label, 50, y + 5);
        doc.text(r.count.toString(), 220, y + 5, { align: 'center' });
        doc.text(`₹ ${r.amount.toLocaleString('en-IN')}`, 400, y + 5, { align: 'right' });
        y += 20;
      });

      y += 15;

      // Section B: Category-wise Activity
      doc.fillColor(secondaryColor).fontSize(13).font('Helvetica-Bold').text('CATEGORY-WISE PERFORMANCE', 40, y);
      doc.strokeColor(secondaryColor).lineWidth(1).moveTo(40, y + 16).lineTo(555, y + 16).stroke();
      y += 25;

      const categories = [
        { key: 'poojaSeva', title: 'Pooja & Seva', data: reportData.categoryBreakup.poojaSeva },
        { key: 'donations', title: 'Donations', data: reportData.categoryBreakup.donations },
        { key: 'sacredItems', title: 'Sacred Items / Prasad', data: reportData.categoryBreakup.sacredItems },
        { key: 'ticketing', title: 'Ticketing / Darshan', data: reportData.categoryBreakup.ticketing }
      ];

      categories.forEach(cat => {
        if (!cat.data) return;
        doc.rect(40, y, 515, 22).fill('#f9f5f0');
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(cat.title, 50, y + 6);
        doc.text(`${cat.data.count} items/txns | ₹ ${cat.data.amount.toLocaleString('en-IN')}`, 350, y + 6, { align: 'right' });
        y += 22;

        doc.fillColor(textColor).fontSize(8.5).font('Helvetica');
        doc.text(`• Online: ${cat.data.onlineCount} txns | ₹ ${cat.data.onlineAmount.toLocaleString('en-IN')}`, 60, y + 4);
        doc.text(`• Counter: ${cat.data.counterCount} txns | ₹ ${cat.data.counterAmount.toLocaleString('en-IN')}`, 300, y + 4);
        y += 18;
      });

      y += 10;

      // Section C: Upcoming Pooja & Seva
      if (reportData.upcomingPoojaSeva.items.length > 0) {
        doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold').text(`TODAY'S POOJA & SEVA SCHEDULE — ${reportData.upcomingPoojaSeva.targetDateFormatted}`, 40, y);
        y += 18;
        reportData.upcomingPoojaSeva.items.forEach(item => {
          doc.fillColor(textColor).fontSize(9).font('Helvetica').text(`• ${item.name}: ${item.count} Bookings`, 50, y);
          y += 14;
        });
        y += 10;
      }

      // Section D: Payment Mode Summary & Exceptions
      doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold').text('PAYMENT COLLECTION BY MODE', 40, y);
      y += 16;
      doc.fillColor(textColor).fontSize(9).font('Helvetica');
      doc.text(`UPI: ₹${reportData.paymentModeSummary.upi.toLocaleString('en-IN')}   |   Cash: ₹${reportData.paymentModeSummary.cash.toLocaleString('en-IN')}   |   Card: ₹${reportData.paymentModeSummary.card.toLocaleString('en-IN')}   |   Other: ₹${reportData.paymentModeSummary.other.toLocaleString('en-IN')}`, 50, y);
      y += 20;

      // Section E: Attention Required / Exceptions
      doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold').text('ATTENTION REQUIRED / EXCEPTIONS', 40, y);
      y += 16;
      doc.rect(40, y, 515, 20).fill(reportData.exceptions.hasExceptions ? '#fff3cd' : '#e8f5e9');
      doc.fillColor(reportData.exceptions.hasExceptions ? '#856404' : '#2e7d32').fontSize(9).font('Helvetica-Bold');
      doc.text(reportData.exceptions.summaryText, 50, y + 5);

      // Footer
      doc.fillColor('#999999').fontSize(8).font('Helvetica').text('All amounts in INR. Generated automatically by DevBhakti.', 40, 780, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        const publicRelativePath = `/uploads/reports/daily/${yearMonth}/${fileName}`;
        resolve(publicRelativePath);
      });

      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
