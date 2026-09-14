import { prisma } from '../lib/prisma';
import { generateDailyReportData } from '../services/dailyReportEngine';
import { generateDailyReportPDF } from '../services/pdfReportGenerator';

async function main() {
  console.log('--- Testing Daily Activity Report Engine ---');

  // Find a temple or mandal from database
  const temple = await prisma.temple.findFirst({ where: { isActive: true } });
  const mandal = await prisma.mandal.findFirst({ where: { isActive: true } });

  if (!temple && !mandal) {
    console.log('No active Temple or Mandal found in database to test.');
    return;
  }

  if (temple) {
    console.log(`\nTesting for Temple: ${temple.id}`);
    const reportData = await generateDailyReportData(temple.id, 'TEMPLE');
    console.log('Generated Report Data:');
    console.log(JSON.stringify(reportData, null, 2));

    console.log('\nGenerating PDF Report...');
    const pdfPath = await generateDailyReportPDF(reportData);
    console.log('PDF Generated successfully at:', pdfPath);
  }

  if (mandal) {
    console.log(`\nTesting for Mandal: ${mandal.id}`);
    const reportData = await generateDailyReportData(mandal.id, 'MANDAL');
    console.log('Generated Report Data:');
    console.log(JSON.stringify(reportData, null, 2));

    console.log('\nGenerating PDF Report...');
    const pdfPath = await generateDailyReportPDF(reportData);
    console.log('PDF Generated successfully at:', pdfPath);
  }

  console.log('\n--- Test Completed Successfully ---');
}

main().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});
