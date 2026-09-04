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
          description: true,
        },
      }),
      prisma.product.findMany({
        where: { mandalId, status: 'approved' },
        select: {
          id: true,
          name: true,
          image: true,
          category: true,
          description: true,
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
          title: true,
          price: true,
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

    // 1. Normalize phone and find or auto-create Devotee User
    let cleanedPhone = String(devotee.phone || '').replace(/\D/g, '');
    if (cleanedPhone.startsWith('00')) cleanedPhone = cleanedPhone.substring(2);
    if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) cleanedPhone = cleanedPhone.substring(1);
    if (cleanedPhone.length === 10) cleanedPhone = '91' + cleanedPhone;
    const normalizedPhone = '+' + cleanedPhone;

    let devoteeUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: devotee.phone },
          { phone: normalizedPhone },
          { phone: cleanedPhone }
        ],
        role: 'DEVOTEE'
      },
    });

    if (!devoteeUser) {
      const userDisplayId = `DEV-${Date.now().toString().slice(-6)}`;
      devoteeUser = await prisma.user.create({
        data: {
          displayId: userDisplayId,
          name: devotee.name,
          phone: normalizedPhone,
          email: devotee.email || null,
          address: devotee.address || null,
          gothra: devotee.gothra || null,
          role: 'DEVOTEE',
          isVerified: true,
          isActive: true,
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
          let targetPoojaId = item.itemId || item.poojaId;

          // Verify if poojaId exists in DB to prevent foreign key constraint error
          if (targetPoojaId) {
            const exists = await tx.pooja.findUnique({ where: { id: targetPoojaId } });
            if (!exists) targetPoojaId = null;
          }

          if (!targetPoojaId) {
            const firstPooja = await tx.pooja.findFirst({ where: { mandalId, status: true } });
            targetPoojaId = firstPooja?.id;
          }

          if (targetPoojaId) {
            const poojaDisplayId = await generateCustomId('PB');
            await tx.poojaBooking.create({
              data: {
                displayId: poojaDisplayId,
                userId: devoteeUser!.id,
                poojaId: targetPoojaId,
                mandalId,
                packageName: item.packageName || item.itemName || 'Standard Pooja',
                packagePrice: Number(item.price || item.unitPrice || 0),
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
          }
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
              status: 'SUCCESS',
              paymentMethod: payment?.method || 'CASH',
              address: devotee.address || null,
              message: item.message || 'Counter Offline Donation',
            },
          });
        } else if (type === 'TICKET') {
          let targetSlotId = item.itemId || item.slotId;
          if (targetSlotId) {
            const slotExists = await tx.mandalDarshanSlot.findUnique({ where: { id: targetSlotId } });
            if (!slotExists) targetSlotId = null;
          }

          if (!targetSlotId) {
            const todayStr = new Date().toISOString().split('T')[0];
            let defaultSlot = await tx.mandalDarshanSlot.findFirst({ where: { mandalId, date: todayStr } });
            if (!defaultSlot) {
              defaultSlot = await tx.mandalDarshanSlot.findFirst({ where: { mandalId } });
            }
            if (!defaultSlot) {
              defaultSlot = await tx.mandalDarshanSlot.create({
                data: {
                  mandalId,
                  date: todayStr,
                  startTime: '06:00',
                  endTime: '22:00',
                  maxCapacity: 1000,
                },
              });
            }
            targetSlotId = defaultSlot.id;
          }

          const ticketDisplayId = await generateCustomId('MDRID');
          await tx.mandalDarshanTicket.create({
            data: {
              displayId: ticketDisplayId,
              userId: devoteeUser!.id,
              mandalId,
              slotId: targetSlotId!,
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
    }, {
      timeout: 20000, // 20 seconds timeout for interactive transaction
      maxWait: 10000,  // 10 seconds max wait to acquire connection
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
 * Get All Teller Orders (for history listing)
 */
export const getTellerOrders = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    if (!mandalId) {
      return res.status(400).json({ success: false, message: 'Mandal context required' });
    }

    const orders = await prisma.tellerOrder.findMany({
      where: { mandalId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Get Teller Orders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Teller Orders that contain PRODUCT items (for Offline Product Orders page)
 * Sources: 1) TellerOrder with PRODUCT items, 2) SubOrder/Order from dedicated Offline Product form
 */
export const getTellerProductOrders = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    if (!mandalId) {
      return res.status(400).json({ success: false, message: 'Mandal context required' });
    }

    // SOURCE 1: TellerOrder (from Unified Cart checkout - itemType = 'PRODUCT')
    const tellerOrders = await prisma.tellerOrder.findMany({
      where: {
        mandalId,
        items: { some: { itemType: 'PRODUCT' } },
      },
      include: { items: { where: { itemType: 'PRODUCT' } } },
      orderBy: { createdAt: 'desc' },
    });

    // SOURCE 2: SubOrder/Order from dedicated Offline Product form (createOfflineMandalOrder)
    // Using (prisma as any) to bypass stale generated type issues while keeping correct runtime behavior
    const subOrders: any[] = await (prisma as any).subOrder.findMany({
      where: { mandalId },
      include: {
        order: {
          select: {
            id: true,
            displayId: true,
            userId: true,
            totalAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
            user: { select: { name: true, phone: true, email: true } },
          },
        },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Normalize SOURCE 1 (TellerOrders)
    const tellerNormalized = tellerOrders.map((o) => ({
      id: o.id,
      displayId: o.displayId,
      customerName: o.devoteeName,
      customerPhone: o.devoteePhone,
      paymentMethod: o.paymentMethod,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
      source: 'TELLER',
      items: o.items.map((it) => ({
        productName: it.itemName,
        variantName: '',
        price: it.unitPrice,
        quantity: it.quantity,
      })),
    }));

    // Normalize SOURCE 2 (SubOrders from Order model)
    const subOrderNormalized = subOrders.map((s: any) => ({
      id: s.order?.id || s.id,
      displayId: s.order?.displayId || `ORD-${s.id.slice(-6)}`,
      customerName: s.order?.user?.name || 'Customer',
      customerPhone: s.order?.user?.phone || '',
      paymentMethod: s.order?.paymentMethod || 'CASH',
      totalAmount: Number(s.totalAmount || s.order?.totalAmount || 0),
      createdAt: s.createdAt,
      source: 'OFFLINE_FORM',
      items: (s.items || []).map((it: any) => ({
        productName: typeof it.product?.name === 'string'
          ? it.product.name
          : (it.product?.name ? JSON.stringify(it.product.name) : 'Product'),
        variantName: '',
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
      })),
    }));

    // Merge both, sort by most recent first
    const all = [...tellerNormalized, ...subOrderNormalized].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ success: true, data: all });
  } catch (error: any) {
    console.error('Get Teller Product Orders Error:', error);
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
