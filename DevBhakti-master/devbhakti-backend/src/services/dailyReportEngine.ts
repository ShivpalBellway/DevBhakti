import { prisma } from '../lib/prisma';

export interface CategoryChannelBreakup {
  count: number;
  amount: number;
  onlineCount: number;
  onlineAmount: number;
  counterCount: number;
  counterAmount: number;
}

export interface DailyReportData {
  entityId: string;
  entityType: 'TEMPLE' | 'MANDAL';
  entityName: string;
  reportDate: string; // "YYYY-MM-DD" e.g. "2026-08-27"
  reportingPeriodHeader: string; // "27 Aug 2026 | 12:00 AM – 28 Aug 2026 | 12:00 AM"
  generatedAtFormatted: string; // "28 Aug 2026, 12:15 AM"
  
  overallSummary: {
    totalTransactions: number;
    totalCollection: number;
    onlineCount: number;
    onlineAmount: number;
    counterCount: number;
    counterAmount: number;
  };

  categoryBreakup: {
    poojaSeva?: CategoryChannelBreakup;
    donations?: CategoryChannelBreakup;
    sacredItems?: CategoryChannelBreakup;
    ticketing?: CategoryChannelBreakup;
  };

  upcomingPoojaSeva: {
    targetDateFormatted: string; // e.g. "28 August"
    totalBookings: number;
    items: Array<{ name: string; count: number }>;
  };

  sacredItemsSummary: {
    totalQtySold: number;
    totalRevenue: number;
    items: Array<{ name: string; qtySold: number; revenue: number }>;
  };

  donationSummary: {
    totalDonationsCount: number;
    totalDonationAmount: number;
    purposes: Array<{ purpose: string; amount: number }>;
  };

  paymentModeSummary: {
    upi: number;
    cash: number;
    card: number;
    other: number;
    total: number;
  };

  exceptions: {
    hasExceptions: boolean;
    cancellationsCount: number;
    refundsCount: number;
    pendingOrdersCount: number;
    paymentFailuresCount: number;
    summaryText: string;
  };
}

/**
  Formats a Date object to IST string representation.
 */
function getISTDateComponents(date: Date) {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata' };
  const year = date.toLocaleDateString('en-CA', options); // YYYY-MM-DD
  return year;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const generateDailyReportData = async (
  entityId: string,
  entityType: 'TEMPLE' | 'MANDAL',
  targetDateStr?: string
): Promise<DailyReportData> => {
  // If targetDateStr is not provided, default to yesterday in IST
  let targetDate = targetDateStr;
  if (!targetDate) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    targetDate = getISTDateComponents(yesterday);
  }

  // Calculate start and end date timestamps in IST
  const startOfDay = new Date(`${targetDate}T00:00:00.000+05:30`);
  const endOfDay = new Date(`${targetDate}T23:59:59.999+05:30`);

  const nextDayDateStr = getISTDateComponents(new Date(startOfDay.getTime() + 28 * 60 * 60 * 1000));
  const nextDayStart = new Date(`${nextDayDateStr}T00:00:00.000+05:30`);

  // Fetch Entity Details
  let entityName = '';
  if (entityType === 'TEMPLE') {
    const temple = await prisma.temple.findUnique({ where: { id: entityId } });
    if (!temple) throw new Error(`Temple with ID ${entityId} not found`);
    const nameObj: any = temple.name;
    entityName = typeof nameObj === 'object' && nameObj?.en ? nameObj.en : (typeof nameObj === 'string' ? nameObj : 'Temple');
  } else {
    const mandal = await prisma.mandal.findUnique({ where: { id: entityId } });
    if (!mandal) throw new Error(`Mandal with ID ${entityId} not found`);
    const nameObj: any = mandal.name;
    entityName = typeof nameObj === 'object' && nameObj?.en ? nameObj.en : (typeof nameObj === 'string' ? nameObj : 'Mandal');
  }

  // 1. POOJA & SEVA BOOKINGS (Reporting Period)
  const poojaBookings = await prisma.poojaBooking.findMany({
    where: {
      ...(entityType === 'TEMPLE' ? { templeId: entityId } : { mandalId: entityId }),
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: { in: ['BOOKED', 'COMPLETED'] }
    },
    include: { pooja: true }
  });

  let poojaOnlineCount = 0, poojaOnlineAmount = 0;
  let poojaCounterCount = 0, poojaCounterAmount = 0;

  poojaBookings.forEach(b => {
    const isOnline = !b.isOffline && b.bookingSource !== 'COUNTER';
    if (isOnline) {
      poojaOnlineCount++;
      poojaOnlineAmount += b.packagePrice;
    } else {
      poojaCounterCount++;
      poojaCounterAmount += b.packagePrice;
    }
  });

  // 2. DONATIONS (Reporting Period)
  const donations = await prisma.donation.findMany({
    where: {
      ...(entityType === 'TEMPLE' ? { templeId: entityId } : { mandalId: entityId }),
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: { in: ['COMPLETED', 'SUCCESS', 'PAID'] }
    }
  });

  let donationOnlineCount = 0, donationOnlineAmount = 0;
  let donationCounterCount = 0, donationCounterAmount = 0;
  const donationPurposesMap: Record<string, number> = {};

  donations.forEach(d => {
    const isOnline = d.paymentMethod !== 'CASH' && Boolean(d.razorpayPaymentId || d.razorpayOrderId);
    if (isOnline) {
      donationOnlineCount++;
      donationOnlineAmount += d.amount;
    } else {
      donationCounterCount++;
      donationCounterAmount += d.amount;
    }

    const purpose = d.message || 'General';
    donationPurposesMap[purpose] = (donationPurposesMap[purpose] || 0) + d.amount;
  });

  // 3. SACRED ITEMS / PRASAD (Reporting Period)
  const subOrders = await prisma.subOrder.findMany({
    where: {
      ...(entityType === 'TEMPLE' ? { templeId: entityId } : { mandalId: entityId }),
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED', 'REJECTED'] }
    },
    include: { items: { include: { product: true } }, order: true }
  });

  // Teller Orders for physical counter products/prasad
  const tellerOrders = await prisma.tellerOrder.findMany({
    where: {
      ...(entityType === 'TEMPLE' ? { templeId: entityId } : { mandalId: entityId }),
      createdAt: { gte: startOfDay, lte: endOfDay },
      paymentStatus: 'PAID'
    },
    include: { items: true }
  });

  let sacredOnlineCount = 0, sacredOnlineAmount = 0;
  let sacredCounterCount = 0, sacredCounterAmount = 0;
  const itemsMap: Record<string, { qty: number; revenue: number }> = {};

  subOrders.forEach(so => {
    sacredOnlineCount++;
    sacredOnlineAmount += so.totalAmount;
    so.items.forEach(item => {
      const prodNameObj: any = item.product?.name;
      const itemName = typeof prodNameObj === 'object' && prodNameObj?.en ? prodNameObj.en : item.variantName || 'Sacred Item';
      if (!itemsMap[itemName]) itemsMap[itemName] = { qty: 0, revenue: 0 };
      itemsMap[itemName].qty += item.quantity;
      itemsMap[itemName].revenue += item.price * item.quantity;
    });
  });

  tellerOrders.forEach(to => {
    const productItems = (to.items || []).filter(item => {
      const type = (item.itemType || '').toUpperCase();
      const name = (item.itemName || '').toLowerCase();
      if (name.includes('donation')) return false;
      return type === 'PRODUCT' || type === 'MARKETPLACE';
    });

    if (productItems.length > 0) {
      sacredCounterCount++;
      const orderProductTotal = productItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      sacredCounterAmount += orderProductTotal;

      productItems.forEach(item => {
        const itemName = item.itemName || 'Sacred Item';
        if (!itemsMap[itemName]) itemsMap[itemName] = { qty: 0, revenue: 0 };
        itemsMap[itemName].qty += item.quantity;
        itemsMap[itemName].revenue += item.totalPrice;
      });
    }
  });

  // 4. TICKETING / DARSHAN (Reporting Period)
  let ticketingOnlineCount = 0, ticketingOnlineAmount = 0;
  let ticketingCounterCount = 0, ticketingCounterAmount = 0;

  if (entityType === 'TEMPLE') {
    const darshanTickets = await prisma.darshanTicket.findMany({
      where: {
        templeId: entityId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED', 'USED'] }
      }
    });
    darshanTickets.forEach(t => {
      if (t.paymentMethod === 'CASH') {
        ticketingCounterCount++;
        ticketingCounterAmount += t.totalAmount;
      } else {
        ticketingOnlineCount++;
        ticketingOnlineAmount += t.totalAmount;
      }
    });
  } else {
    const mandalTickets = await prisma.mandalDarshanTicket.findMany({
      where: {
        mandalId: entityId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED', 'USED'] }
      }
    });
    mandalTickets.forEach(t => {
      if (t.paymentMethod === 'CASH') {
        ticketingCounterCount++;
        ticketingCounterAmount += t.totalAmount;
      } else {
        ticketingOnlineCount++;
        ticketingOnlineAmount += t.totalAmount;
      }
    });
  }

  // OVERALL SUMMARY CALCULATIONS
  const totalOnlineCount = poojaOnlineCount + donationOnlineCount + sacredOnlineCount + ticketingOnlineCount;
  const totalOnlineAmount = poojaOnlineAmount + donationOnlineAmount + sacredOnlineAmount + ticketingOnlineAmount;
  const totalCounterCount = poojaCounterCount + donationCounterCount + sacredCounterCount + ticketingCounterCount;
  const totalCounterAmount = poojaCounterAmount + donationCounterAmount + sacredCounterAmount + ticketingCounterAmount;
  const totalTransactions = totalOnlineCount + totalCounterCount;
  const totalCollection = totalOnlineAmount + totalCounterAmount;

  // CATEGORY BREAKUP (Hiding empty categories)
  const categoryBreakup: DailyReportData['categoryBreakup'] = {};

  if (poojaOnlineCount + poojaCounterCount > 0) {
    categoryBreakup.poojaSeva = {
      count: poojaOnlineCount + poojaCounterCount,
      amount: poojaOnlineAmount + poojaCounterAmount,
      onlineCount: poojaOnlineCount,
      onlineAmount: poojaOnlineAmount,
      counterCount: poojaCounterCount,
      counterAmount: poojaCounterAmount
    };
  }

  if (donationOnlineCount + donationCounterCount > 0) {
    categoryBreakup.donations = {
      count: donationOnlineCount + donationCounterCount,
      amount: donationOnlineAmount + donationCounterAmount,
      onlineCount: donationOnlineCount,
      onlineAmount: donationOnlineAmount,
      counterCount: donationCounterCount,
      counterAmount: donationCounterAmount
    };
  }

  if (sacredOnlineCount + sacredCounterCount > 0) {
    categoryBreakup.sacredItems = {
      count: sacredOnlineCount + sacredCounterCount,
      amount: sacredOnlineAmount + sacredCounterAmount,
      onlineCount: sacredOnlineCount,
      onlineAmount: sacredOnlineAmount,
      counterCount: sacredCounterCount,
      counterAmount: sacredCounterAmount
    };
  }

  if (ticketingOnlineCount + ticketingCounterCount > 0) {
    categoryBreakup.ticketing = {
      count: ticketingOnlineCount + ticketingCounterCount,
      amount: ticketingOnlineAmount + ticketingCounterAmount,
      onlineCount: ticketingOnlineCount,
      onlineAmount: ticketingOnlineAmount,
      counterCount: ticketingCounterCount,
      counterAmount: ticketingCounterAmount
    };
  }

  // 5. UPCOMING POOJA & SEVA (Target Date + 1 Day, i.e. 28 Aug)
  const nextDayEnd = new Date(`${nextDayDateStr}T23:59:59.999+05:30`);
  const upcomingBookings = await prisma.poojaBooking.findMany({
    where: {
      ...(entityType === 'TEMPLE' ? { templeId: entityId } : { mandalId: entityId }),
      status: { in: ['BOOKED', 'COMPLETED'] },
      OR: [
        { bookingDate: nextDayDateStr },
        { createdAt: { gte: nextDayStart, lte: nextDayEnd } }
      ]
    },
    include: { pooja: true }
  });

  const upcomingMap: Record<string, number> = {};
  upcomingBookings.forEach(b => {
    const pNameObj: any = b.pooja?.name;
    const pName = typeof pNameObj === 'object' && pNameObj?.en ? pNameObj.en : (b.packageName || 'Pooja');
    upcomingMap[pName] = (upcomingMap[pName] || 0) + 1;
  });

  const upcomingItems = Object.entries(upcomingMap).map(([name, count]) => ({ name, count }));

  // 6. SACRED ITEMS ITEMS LIST
  const sacredItemsList = Object.entries(itemsMap).map(([name, val]) => ({
    name,
    qtySold: val.qty,
    revenue: val.revenue
  }));
  const totalSacredQty = sacredItemsList.reduce((acc, curr) => acc + curr.qtySold, 0);

  // 7. DONATION PURPOSES LIST
  const donationPurposes = Object.entries(donationPurposesMap).map(([purpose, amount]) => ({ purpose, amount }));

  // 8. PAYMENT MODE SUMMARY
  let upi = 0, cash = 0, card = 0, other = 0;

  poojaBookings.forEach(b => {
    const method = (b.paymentMethod || '').toUpperCase();
    if (b.isOffline || method === 'CASH') cash += b.packagePrice;
    else if (method.includes('UPI')) upi += b.packagePrice;
    else if (method.includes('CARD')) card += b.packagePrice;
    else other += b.packagePrice;
  });

  donations.forEach(d => {
    const method = (d.paymentMethod || '').toUpperCase();
    if (method === 'CASH') cash += d.amount;
    else if (method.includes('UPI')) upi += d.amount;
    else if (method.includes('CARD')) card += d.amount;
    else other += d.amount;
  });

  tellerOrders.forEach(to => {
    const productItems = (to.items || []).filter(item => {
      const type = (item.itemType || '').toUpperCase();
      return type === 'PRODUCT' || type === 'MARKETPLACE';
    });
    if (productItems.length > 0) {
      const orderProductTotal = productItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const method = (to.paymentMethod || '').toUpperCase();
      if (method === 'CASH') cash += orderProductTotal;
      else if (method.includes('UPI')) upi += orderProductTotal;
      else if (method.includes('CARD')) card += orderProductTotal;
      else other += orderProductTotal;
    }
  });

  // 9. EXCEPTIONS / ATTENTION REQUIRED
  const cancelledBookingsCount = await prisma.poojaBooking.count({
    where: {
      ...(entityType === 'TEMPLE' ? { templeId: entityId } : { mandalId: entityId }),
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: 'CANCELLED'
    }
  });

  const pendingPrasadCount = await prisma.poojaBooking.count({
    where: {
      ...(entityType === 'TEMPLE' ? { templeId: entityId } : { mandalId: entityId }),
      isPrasadRequested: true,
      prasadStatus: 'PREPARING'
    }
  });

  const hasExceptions = cancelledBookingsCount > 0 || pendingPrasadCount > 0;
  const exceptionNotes: string[] = [];

  if (cancelledBookingsCount > 0) exceptionNotes.push(`${cancelledBookingsCount} cancellations`);
  if (pendingPrasadCount > 0) exceptionNotes.push(`${pendingPrasadCount} orders pending fulfilment`);

  const exceptionSummaryText = hasExceptions
    ? exceptionNotes.join(' • ')
    : '✓ No exceptions requiring attention';

  // HEADER & DATES FORMATTING
  const targetFormatted = formatDateHeader(targetDate);
  const nextDayFormatted = formatDateHeader(nextDayDateStr);
  const reportingPeriodHeader = `${targetFormatted} | 12:00 AM – ${nextDayFormatted} | 12:00 AM`;
  
  const now = new Date();
  const generatedAtFormatted = `${formatDateHeader(getISTDateComponents(now))}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`;

  return {
    entityId,
    entityType,
    entityName,
    reportDate: targetDate,
    reportingPeriodHeader,
    generatedAtFormatted,
    overallSummary: {
      totalTransactions,
      totalCollection,
      onlineCount: totalOnlineCount,
      onlineAmount: totalOnlineAmount,
      counterCount: totalCounterCount,
      counterAmount: totalCounterAmount
    },
    categoryBreakup,
    upcomingPoojaSeva: {
      targetDateFormatted: formatDateShort(nextDayDateStr),
      totalBookings: upcomingBookings.length,
      items: upcomingItems
    },
    sacredItemsSummary: {
      totalQtySold: totalSacredQty,
      totalRevenue: sacredOnlineAmount + sacredCounterAmount,
      items: sacredItemsList
    },
    donationSummary: {
      totalDonationsCount: donationOnlineCount + donationCounterCount,
      totalDonationAmount: donationOnlineAmount + donationCounterAmount,
      purposes: donationPurposes
    },
    paymentModeSummary: {
      upi,
      cash,
      card,
      other,
      total: upi + cash + card + other
    },
    exceptions: {
      hasExceptions,
      cancellationsCount: cancelledBookingsCount,
      refundsCount: 0,
      pendingOrdersCount: pendingPrasadCount,
      paymentFailuresCount: 0,
      summaryText: exceptionSummaryText
    }
  };
};
