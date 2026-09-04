import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { generateCustomId } from '../../utils/idGenerator';
import { LedgerType, LedgerStatus } from '@prisma/client';

/**
 * Get catalog (Poojas, Product Categories / Products, Darshan Slots) for Teller Counter UI
 */
export const getTellerCatalog = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    if (!mandalId) {
      return res.status(400).json({ success: false, message: 'Mandal context missing' });
    }

    const [poojas, products, slots] = await Promise.all([
      prisma.pooja.findMany({
        where: { mandalId, status: true },
        select: {
          id: true,
          name: true,
          price: true,
          packages: true,
          image: true,
          category: true,
        },
      }),
      prisma.product.findMany({
        where: { mandalId, status: 'approved' },
        select: {
          id: true,
          name: true,
          image: true,
          category: true,
          variants: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, stock: true },
          },
        },
      }),
      prisma.mandalDarshanSlot.findMany({
        where: { mandalId, isClosed: false },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          maxCapacity: true,
          bookedCount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        poojas,
        products,
        slots,
      },
    });
  } catch (error: any) {
    console.error('Error fetching teller catalog:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process Unified Teller Checkout (Multi-item Cart)
 */
export const processTellerCheckout = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const staffId = (req as any).user?.id || (req as any).owner?.userId;

    const { devotee, payment, items } = req.body;

    if (!mandalId) {
      return res.status(400).json({ success: false, message: 'Mandal context required' });
    }

    if (!devotee || !devotee.phone || !devotee.name) {
      return res.status(400).json({ success: false, message: 'Devotee name and phone number are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    // 1. Find or create Devotee User by phone
    let devoteeUser = await prisma.user.findFirst({
      where: { phone: devotee.phone, role: 'DEVOTEE' },
    });

    if (!devoteeUser) {
      devoteeUser = await prisma.user.create({
        data: {
          name: devotee.name,
          phone: devotee.phone,
          email: devotee.email || null,
          address: devotee.address || null,
          gothra: devotee.gothra || null,
          role: 'DEVOTEE',
          isVerified: true,
        },
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      const itemPrice = Number(item.price || item.unitPrice || 0);
      const qty = Number(item.quantity || 1);
      const lineTotal = itemPrice * qty;
      totalAmount += lineTotal;

      orderItemsData.push({
        itemType: item.itemType || item.type, // POOJA, DONATION, TICKET, PRODUCT
        itemId: item.itemId || item.id || null,
        itemName: item.itemName || item.name || 'Item',
        unitPrice: itemPrice,
        quantity: qty,
        totalPrice: lineTotal,
        metadata: item.metadata || item,
      });
    }

    // Generate Display ID (e.g., MT2609040001)
    const displayId = await generateCustomId('MT');

    // 2. Execute DB Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create TellerOrder
      const tellerOrder = await tx.tellerOrder.create({
        data: {
          displayId,
          mandalId,
          devoteeId: devoteeUser!.id,
          devoteeName: devotee.name,
          devoteePhone: devotee.phone,
          devoteeEmail: devotee.email || null,
          totalAmount,
          paymentMethod: payment?.method || 'CASH',
          paymentStatus: 'PAID',
          transactionRef: payment?.transactionRef || null,
          createdByStaffId: staffId || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Synchronize with existing tables for backward-compatibility & analytics
      for (const item of items) {
        const type = (item.itemType || item.type || '').toUpperCase();
        if (type === 'POOJA') {
          const poojaDisplayId = await generateCustomId('PB');
          await tx.poojaBooking.create({
            data: {
              displayId: poojaDisplayId,
              userId: devoteeUser!.id,
              poojaId: item.itemId || item.poojaId,
              mandalId,
              packageName: item.packageName || item.itemName || 'Standard Pooja',
              packagePrice: Number(item.price || 0),
              devoteeName: devotee.name,
              devoteePhone: devotee.phone,
              devoteeEmail: devotee.email || null,
              bookingDate: item.bookingDate || new Date().toISOString().split('T')[0],
              specialRequests: item.specialRequests || null,
              gothra: devotee.gothra || null,
              status: 'BOOKED',
              isOffline: true,
              bookingSource: 'COUNTER',
              paymentMethod: payment?.method || 'CASH',
              createdByStaffId: staffId || null,
              transactionRef: displayId, // linked to Master Teller Order
            },
          });
        } else if (type === 'DONATION') {
          const donDisplayId = await generateCustomId('DN');
          await tx.donation.create({
            data: {
              displayId: donDisplayId,
              userId: devoteeUser!.id,
              mandalId,
              donorName: devotee.name,
              donorPhone: devotee.phone,
              donorEmail: devotee.email || '',
              amount: Number(item.price || item.amount || 0),
              status: 'PAID',
              paymentMethod: payment?.method || 'CASH',
              address: devotee.address || null,
              message: item.message || 'Counter Offline Donation',
            },
          });
        } else if (type === 'TICKET') {
          const ticketDisplayId = await generateCustomId('MDRID');
          await tx.mandalDarshanTicket.create({
            data: {
              displayId: ticketDisplayId,
              userId: devoteeUser!.id,
              mandalId,
              slotId: item.itemId || item.slotId || null,
              visitorName: devotee.name,
              visitorPhone: devotee.phone,
              visitorEmail: devotee.email || null,
              visitorCount: Number(item.quantity || 1),
              totalAmount: Number(item.totalPrice || item.price || 0),
              status: 'CONFIRMED' as any,
              paymentMethod: payment?.method || 'CASH',
            },
          });
        }
      }

      // Add entry into MandalLedger for total counter collection
      await tx.mandalLedger.create({
        data: {
          mandalId,
          amount: totalAmount,
          grossAmount: totalAmount,
          commission: 0,
          type: LedgerType.POOJA_EARNING,
          sourceId: tellerOrder.id,
          description: `Counter Checkout Receipt #${displayId} (${payment?.method || 'CASH'})`,
          status: LedgerStatus.COMPLETED,
          paymentMethod: payment?.method || 'CASH',
        } as any,
      });

      return tellerOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Teller counter order processed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Teller Checkout Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Today's Teller Counter Summary / Reports
 */
export const getTellerSummary = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    if (!mandalId) {
      return res.status(400).json({ success: false, message: 'Mandal context required' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await prisma.tellerOrder.findMany({
      where: {
        mandalId,
        createdAt: { gte: startOfDay },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalCollection = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let otherTotal = 0;

    let poojaTotal = 0;
    let donationTotal = 0;
    let productTotal = 0;
    let ticketTotal = 0;

    for (const order of orders) {
      totalCollection += order.totalAmount;
      const method = (order.paymentMethod || '').toUpperCase();
      if (method === 'CASH') cashTotal += order.totalAmount;
      else if (method === 'UPI') upiTotal += order.totalAmount;
      else if (method === 'CARD') cardTotal += order.totalAmount;
      else otherTotal += order.totalAmount;

      for (const item of order.items) {
        const type = (item.itemType || '').toUpperCase();
        if (type === 'POOJA') poojaTotal += item.totalPrice;
        else if (type === 'DONATION') donationTotal += item.totalPrice;
        else if (type === 'PRODUCT') productTotal += item.totalPrice;
        else if (type === 'TICKET') ticketTotal += item.totalPrice;
      }
    }

    res.json({
      success: true,
      data: {
        totalOrdersCount: orders.length,
        totalCollection,
        paymentSplit: {
          cash: cashTotal,
          upi: upiTotal,
          card: cardTotal,
          other: otherTotal,
        },
        categorySplit: {
          pooja: poojaTotal,
          donation: donationTotal,
          product: productTotal,
          ticket: ticketTotal,
        },
        recentOrders: orders.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('Teller Summary Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
