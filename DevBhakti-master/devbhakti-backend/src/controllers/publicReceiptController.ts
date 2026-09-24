import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateMandalReceiptHTML, MandalReceiptData, ReceiptItem } from '../utils/mandalReceiptTemplate';
import PDFDocument from 'pdfkit';

/**
 * Fetch and construct standardized MandalReceiptData from any transaction type
 */
async function getReceiptDataForTransaction(transactionId: string): Promise<MandalReceiptData | null> {
  // 1. Try TellerOrder (Counter Cart Order)
  const tellerOrder = await prisma.tellerOrder.findFirst({
    where: {
      OR: [
        { displayId: transactionId },
        { id: transactionId },
        { transactionRef: transactionId }
      ]
    },
    include: { items: true, mandal: true }
  });

  if (tellerOrder && tellerOrder.mandal) {
    const mandal = tellerOrder.mandal;
    let config: any = mandal.receiptConfig || {};
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch (e) { config = {}; }
    }

    const items: ReceiptItem[] = tellerOrder.items.map((it, idx) => ({
      srNo: idx + 1,
      description: `${it.itemName} (${it.itemType})`,
      quantity: it.quantity || 1,
      amount: it.totalPrice || 0
    }));

    const rawName = mandal.name;
    const mandalNameStr = typeof rawName === 'string' ? rawName : (rawName as any)?.en || (rawName as any)?.hi || 'Mandal';

    return {
      receiptNo: tellerOrder.displayId || tellerOrder.id,
      dateTime: new Date(tellerOrder.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      paymentMode: tellerOrder.paymentMethod || 'CASH',
      transactionId: tellerOrder.transactionRef || tellerOrder.displayId,
      mandalName: mandalNameStr,
      mandalAddress: mandal.address || mandal.city || 'India',
      mandalSlug: mandal.slug || 'mandal',
      headerBanner: config.headerBanner || null,
      sponsors: config.sponsors || [],
      customThankYouNote: config.customThankYouNote || '',
      devoteeName: tellerOrder.devoteeName,
      devoteePhone: tellerOrder.devoteePhone,
      items,
      totalAmount: tellerOrder.totalAmount
    };
  }

  // 2. Try Donation
  const donation = await prisma.donation.findFirst({
    where: {
      OR: [
        { displayId: transactionId },
        { id: transactionId },
        { razorpayPaymentId: transactionId },
        { razorpayOrderId: transactionId }
      ]
    },
    include: { mandal: true }
  });

  if (donation && donation.mandal) {
    const mandal = donation.mandal;
    let config: any = mandal.receiptConfig || {};
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch (e) { config = {}; }
    }

    const rawName = mandal.name;
    const mandalNameStr = typeof rawName === 'string' ? rawName : (rawName as any)?.en || (rawName as any)?.hi || 'Mandal';

    return {
      receiptNo: donation.displayId || donation.id,
      dateTime: new Date(donation.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      paymentMode: donation.paymentMethod || 'ONLINE',
      transactionId: donation.razorpayPaymentId || donation.displayId || donation.id,
      mandalName: mandalNameStr,
      mandalAddress: mandal.address || mandal.city || 'India',
      mandalSlug: mandal.slug || 'mandal',
      headerBanner: config.headerBanner || null,
      sponsors: config.sponsors || [],
      customThankYouNote: config.customThankYouNote || '',
      devoteeName: donation.donorName,
      devoteePhone: donation.donorPhone,
      items: [
        {
          srNo: 1,
          description: donation.message ? `Donation / Contribution (${donation.message})` : 'General Seva Donation',
          quantity: 1,
          amount: donation.amount
        }
      ],
      totalAmount: donation.amount
    };
  }

  // 3. Try PoojaBooking
  const booking = await prisma.poojaBooking.findFirst({
    where: {
      OR: [
        { displayId: transactionId },
        { id: transactionId },
        { razorpayPaymentId: transactionId },
        { razorpayOrderId: transactionId }
      ]
    },
    include: { pooja: true, mandal: true }
  });

  if (booking && booking.mandal) {
    const mandal = booking.mandal;
    let config: any = mandal.receiptConfig || {};
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch (e) { config = {}; }
    }

    const rawName = mandal.name;
    const mandalNameStr = typeof rawName === 'string' ? rawName : (rawName as any)?.en || (rawName as any)?.hi || 'Mandal';

    const poojaRawName = booking.pooja?.name;
    const poojaNameStr = typeof poojaRawName === 'string' ? poojaRawName : (poojaRawName as any)?.en || (poojaRawName as any)?.hi || booking.packageName || 'Pooja Seva';

    return {
      receiptNo: booking.displayId || booking.id,
      dateTime: new Date(booking.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      paymentMode: booking.paymentMethod || 'ONLINE',
      transactionId: booking.razorpayPaymentId || booking.displayId || booking.id,
      mandalName: mandalNameStr,
      mandalAddress: mandal.address || mandal.city || 'India',
      mandalSlug: mandal.slug || 'mandal',
      headerBanner: config.headerBanner || null,
      sponsors: config.sponsors || [],
      customThankYouNote: config.customThankYouNote || '',
      devoteeName: booking.devoteeName,
      devoteePhone: booking.devoteePhone,
      items: [
        {
          srNo: 1,
          description: `${poojaNameStr} (${booking.packageName})`,
          quantity: 1,
          amount: booking.packagePrice
        }
      ],
      totalAmount: booking.packagePrice
    };
  }

  // 4. Try MandalDarshanTicket
  const ticket = await prisma.mandalDarshanTicket.findFirst({
    where: {
      OR: [
        { displayId: transactionId },
        { id: transactionId }
      ]
    },
    include: { slot: true, mandal: true }
  });

  if (ticket && ticket.mandal) {
    const mandal = ticket.mandal;
    let config: any = mandal.receiptConfig || {};
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch (e) { config = {}; }
    }

    const rawName = mandal.name;
    const mandalNameStr = typeof rawName === 'string' ? rawName : (rawName as any)?.en || (rawName as any)?.hi || 'Mandal';

    return {
      receiptNo: ticket.displayId || ticket.id,
      dateTime: new Date(ticket.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      paymentMode: ticket.paymentMethod || 'COUNTER',
      transactionId: ticket.displayId || ticket.id,
      mandalName: mandalNameStr,
      mandalAddress: mandal.address || mandal.city || 'India',
      mandalSlug: mandal.slug || 'mandal',
      headerBanner: config.headerBanner || null,
      sponsors: config.sponsors || [],
      customThankYouNote: config.customThankYouNote || '',
      devoteeName: ticket.visitorName,
      devoteePhone: ticket.visitorPhone,
      items: [
        {
          srNo: 1,
          description: `Darshan Ticket (${ticket.slot?.title || 'General Darshan'})`,
          quantity: ticket.visitorCount || 1,
          amount: ticket.totalAmount
        }
      ],
      totalAmount: ticket.totalAmount
    };
  }

  return null;
}

/**
 * 1️⃣ GET /api/v1/mandal/receipts/:transactionId/html
 * Returns ready-made HTML receipt response for Mobile App WebView
 */
export const getMandalReceiptHTMLResponse = async (req: Request, res: Response) => {
  try {
    const rawTxId = req.params.transactionId;
    const transactionId = Array.isArray(rawTxId) ? rawTxId[0] : (rawTxId as string);
    if (!transactionId) {
      return res.status(400).send('<h2>Transaction ID is required</h2>');
    }

    const receiptData = await getReceiptDataForTransaction(transactionId);
    if (!receiptData) {
      return res.status(404).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #ef4444;">Receipt Not Found</h2>
            <p>No receipt transaction record found for ID: <strong>${transactionId}</strong></p>
          </body>
        </html>
      `);
    }

    const htmlContent = generateMandalReceiptHTML(receiptData);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlContent);
  } catch (error: any) {
    console.error('Error in getMandalReceiptHTMLResponse:', error);
    return res.status(500).send('<h2>Internal Server Error generating receipt HTML</h2>');
  }
};

/**
 * 2️⃣ GET /api/v1/mandal/receipts/:transactionId/pdf
 * Returns ready-made PDF stream/buffer response for Mobile App download
 */
export const getMandalReceiptPDFResponse = async (req: Request, res: Response) => {
  try {
    const rawTxId = req.params.transactionId;
    const transactionId = Array.isArray(rawTxId) ? rawTxId[0] : (rawTxId as string);
    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required' });
    }

    const receiptData = await getReceiptDataForTransaction(transactionId);

    if (!receiptData) {
      return res.status(404).json({ success: false, message: 'Receipt transaction not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${receiptData.receiptNo}.pdf"`);

    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    doc.pipe(res);

    const primaryColor = '#7b4623';
    const secondaryColor = '#0f172a';
    const lightBg = '#fdfaf6';
    const borderColor = '#f1e6da';

    // Header Card
    doc.rect(36, 36, 523, 70).fill(lightBg).stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(18).font('Helvetica-Bold').text(receiptData.mandalName, 50, 48);
    doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(receiptData.mandalAddress || 'India', 50, 70);

    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('PAYMENT RECEIPT', 380, 50, { align: 'right' });
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Powered by DevBhakti', 380, 68, { align: 'right' });

    let y = 120;

    // Details Box
    doc.rect(36, y, 523, 65).fill('#ffffff').stroke('#cbd5e1');
    doc.fillColor(secondaryColor).fontSize(9.5).font('Helvetica');
    doc.text(`Receipt No: ${receiptData.receiptNo}`, 50, y + 12);
    doc.text(`Date & Time: ${receiptData.dateTime}`, 50, y + 28);
    doc.text(`Payment Mode: ${receiptData.paymentMode}`, 50, y + 44);

    doc.text(`Devotee: ${receiptData.devoteeName || 'Devotee'}`, 300, y + 12);
    doc.text(`Phone: ${receiptData.devoteePhone || 'N/A'}`, 300, y + 28);
    doc.text(`Txn Ref: ${receiptData.transactionId}`, 300, y + 44);

    y += 80;

    // Items Table Header
    doc.rect(36, y, 523, 24).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Sr.', 46, y + 7);
    doc.text('Description', 90, y + 7);
    doc.text('Qty', 380, y + 7, { align: 'center' });
    doc.text('Amount (₹)', 460, y + 7, { align: 'right' });

    y += 24;

    // Items Rows
    receiptData.items.forEach((item, index) => {
      const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(36, y, 523, 24).fill(bg).stroke('#f1f5f9');
      doc.fillColor('#334155').fontSize(9.5).font('Helvetica');
      doc.text(String(item.srNo || index + 1), 46, y + 7);
      doc.text(item.description, 90, y + 7, { width: 280, height: 16 });
      doc.text(String(item.quantity || 1), 380, y + 7, { align: 'center' });
      doc.text(`₹ ${item.amount.toLocaleString('en-IN')}`, 460, y + 7, { align: 'right' });
      y += 24;
    });

    // Total Row
    doc.rect(36, y, 523, 28).fill('#fefcf9').stroke(primaryColor);
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold');
    doc.text('Total Amount Paid:', 90, y + 8);
    doc.text(`₹ ${receiptData.totalAmount.toLocaleString('en-IN')}`, 460, y + 8, { align: 'right' });

    y += 45;

    // Thank You & Notes
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('🙏 Thank you for your generous contribution!', 36, y);
    y += 16;
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(
      receiptData.customThankYouNote || 'Your support helps us continue our seva and keep our traditions alive.',
      36, y, { width: 523 }
    );

    y += 35;
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(
      'This is a system generated official receipt from DevBhakti Platform.',
      36, y, { align: 'center', width: 523 }
    );

    doc.end();
  } catch (error: any) {
    console.error('Error in getMandalReceiptPDFResponse:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error generating receipt PDF' });
  }
};
