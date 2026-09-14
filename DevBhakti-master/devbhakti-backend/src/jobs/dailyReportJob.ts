import { prisma } from '../lib/prisma';
import { generateDailyReportData } from '../services/dailyReportEngine';
import { generateDailyReportPDF } from '../services/pdfReportGenerator';
import { sendDailyReportEmail } from '../services/dailyReportMailService';
import { sendDailyReportWhatsApp } from '../services/dailyReportWhatsAppService';

export const runDailyActivityReports = async (targetDateStr?: string) => {
  console.log(`[DailyReportJob] Starting Daily Activity Report generation cycle...`);

  // Fetch active Temples
  const temples = await prisma.temple.findMany({
    where: { isActive: true },
    include: { user: true }
  });

  // Fetch active Mandals
  const mandals = await prisma.mandal.findMany({
    where: { isActive: true, status: 'APPROVED' }
  });

  console.log(`[DailyReportJob] Found ${temples.length} active Temples and ${mandals.length} active Mandals.`);

  // Process Temples
  for (const temple of temples) {
    try {
      console.log(`[DailyReportJob] Processing Temple: ${temple.id}`);
      const reportData = await generateDailyReportData(temple.id, 'TEMPLE', targetDateStr);
      const pdfRelativePath = await generateDailyReportPDF(reportData);
      const fullPdfUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}${pdfRelativePath}`;

      const recipientEmail = temple.user?.email || temple.phone || '';
      const recipientPhone = temple.phone || temple.user?.phone || '';
      const managerName = temple.user?.name || 'Temple Management';

      let emailSent = false;
      if (recipientEmail && recipientEmail.includes('@')) {
        const mailRes = await sendDailyReportEmail(recipientEmail, reportData, fullPdfUrl);
        emailSent = mailRes.success;
      }

      let whatsappSent = false;
      if (recipientPhone) {
        const waRes = await sendDailyReportWhatsApp(recipientPhone, managerName, reportData, fullPdfUrl);
        whatsappSent = waRes.success;
      }

      // Upsert snapshot into database
      await (prisma as any).dailyActivityReport.upsert({
        where: {
          templeId_reportDate: {
            templeId: temple.id,
            reportDate: reportData.reportDate
          }
        },
        update: {
          reportingPeriod: reportData.reportingPeriodHeader,
          reportData: JSON.parse(JSON.stringify(reportData)),
          pdfUrl: fullPdfUrl,
          emailSent,
          emailSentAt: emailSent ? new Date() : null,
          whatsappSent,
          whatsappSentAt: whatsappSent ? new Date() : null
        },
        create: {
          entityType: 'TEMPLE',
          templeId: temple.id,
          reportDate: reportData.reportDate,
          reportingPeriod: reportData.reportingPeriodHeader,
          reportData: JSON.parse(JSON.stringify(reportData)),
          pdfUrl: fullPdfUrl,
          emailSent,
          emailSentAt: emailSent ? new Date() : null,
          whatsappSent,
          whatsappSentAt: whatsappSent ? new Date() : null
        }
      });

      console.log(`[DailyReportJob] Successfully processed Temple: ${temple.id} (Email: ${emailSent}, WhatsApp: ${whatsappSent})`);
    } catch (err: any) {
      console.error(`[DailyReportJob] Error processing Temple ${temple.id}:`, err.message || err);
    }
  }

  // Process Mandals
  for (const mandal of mandals) {
    try {
      console.log(`[DailyReportJob] Processing Mandal: ${mandal.id}`);
      const reportData = await generateDailyReportData(mandal.id, 'MANDAL', targetDateStr);
      const pdfRelativePath = await generateDailyReportPDF(reportData);
      const fullPdfUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}${pdfRelativePath}`;

      const recipientEmail = mandal.email || '';
      const recipientPhone = mandal.contactNumber || '';
      const managerName = mandal.presidentName || 'Mandal Management';

      let emailSent = false;
      if (recipientEmail && recipientEmail.includes('@')) {
        const mailRes = await sendDailyReportEmail(recipientEmail, reportData, fullPdfUrl);
        emailSent = mailRes.success;
      }

      let whatsappSent = false;
      if (recipientPhone) {
        const waRes = await sendDailyReportWhatsApp(recipientPhone, managerName, reportData, fullPdfUrl);
        whatsappSent = waRes.success;
      }

      // Upsert snapshot into database
      await (prisma as any).dailyActivityReport.upsert({
        where: {
          mandalId_reportDate: {
            mandalId: mandal.id,
            reportDate: reportData.reportDate
          }
        },
        update: {
          reportingPeriod: reportData.reportingPeriodHeader,
          reportData: JSON.parse(JSON.stringify(reportData)),
          pdfUrl: fullPdfUrl,
          emailSent,
          emailSentAt: emailSent ? new Date() : null,
          whatsappSent,
          whatsappSentAt: whatsappSent ? new Date() : null
        },
        create: {
          entityType: 'MANDAL',
          mandalId: mandal.id,
          reportDate: reportData.reportDate,
          reportingPeriod: reportData.reportingPeriodHeader,
          reportData: JSON.parse(JSON.stringify(reportData)),
          pdfUrl: fullPdfUrl,
          emailSent,
          emailSentAt: emailSent ? new Date() : null,
          whatsappSent,
          whatsappSentAt: whatsappSent ? new Date() : null
        }
      });

      console.log(`[DailyReportJob] Successfully processed Mandal: ${mandal.id} (Email: ${emailSent}, WhatsApp: ${whatsappSent})`);
    } catch (err: any) {
      console.error(`[DailyReportJob] Error processing Mandal ${mandal.id}:`, err.message || err);
    }
  }

  console.log(`[DailyReportJob] Daily Activity Report cycle finished.`);
};
