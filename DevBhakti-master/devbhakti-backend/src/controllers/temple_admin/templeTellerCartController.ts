import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { generateCustomId } from '../../utils/idGenerator';
import { LedgerType, LedgerStatus, SlabType, CommissionCategory } from '@prisma/client';
import { getCommissionForAmount } from '../admin/commissionSlabController';
import { getLang, localize } from '../../utils/localization';

/**
 * Get catalog (Poojas, Products, Darshan Slots, Photography Packages) for Temple Teller Counter UI
 */
export const getTempleTellerCatalog = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId || (req as any).templeId;
    if (!templeId) {
      return res.status(400).json({ success: false, message: 'Temple context missing' });
    }

    const lang = getLang(req);

    const [poojasRaw, productsRaw, slots, photoPackagesRaw, photoSlots] = await Promise.all([
      prisma.pooja.findMany({
        where: { templeId, status: true },
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
        where: { templeId, status: 'approved' },
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
      prisma.darshanSlot.findMany({
        where: { templeId, isClosed: false },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          maxCapacity: true,
          bookedCount: true,
        },
      }),
      prisma.photographyPackage.findMany({
        where: { templeId, isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
          description: true,
        },
      }),
      prisma.photographySlot.findMany({
        where: { templeId, isActive: true },
        select: {
          id: true,
          slotName: true,
          maxBookingsPerDay: true,
        },
      }),
    ]);

    const poojas = localize(poojasRaw, lang);
    const products = localize(productsRaw, lang);
    const photoPackages = localize(photoPackagesRaw, lang);

    // Fetch temple details for darshan/prasad pricing fallbacks
    const temple = await prisma.temple.findUnique({
      where: { id: templeId },
      select: { darshanPrice: true, prasadPrice: true, allowedPhotoAreas: true },
    });

    res.json({
      success: true,
      data: {
        poojas,
        products,
        slots,
        photoPackages,
        photoSlots,
        darshanPrice: temple?.darshanPrice || 0,
        prasadPrice: temple?.prasadPrice || 0,
        allowedPhotoAreas: temple?.allowedPhotoAreas || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching temple teller catalog:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Calculate live cart platform fees based on offline Temple commission slabs
 */
export const calculateTempleCartCommission = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId || (req as any).templeId;
    const { items } = req.body;

    if (!templeId) {
      return res.status(400).json({ success: false, message: 'Temple context required' });
    }

    if (!items || !Array.isArray(items)) {
      return res.json({ success: true, data: { itemsBreakdown: [], totalPlatformFee: 0 } });
    }

    let totalPlatformFee = 0;
    const itemsBreakdown: any[] = [];

    for (const item of items) {
      const type = (item.itemType || item.type || '').toUpperCase();
      let category: CommissionCategory = CommissionCategory.POOJA;
      if (type === 'MARKETPLACE' || type === 'PRODUCT') category = CommissionCategory.MARKETPLACE;
      if (type === 'DONATION') category = CommissionCategory.DONATION;

      const itemTotal = Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1);
      let itemPlatformFee = 0;
      let percentage = 0;

      try {
        const commResult = await getCommissionForAmount(itemTotal, SlabType.TEMPLE, templeId, category, true);
        if (commResult) {
          itemPlatformFee = commResult.totalCommission || 0;
          percentage = commResult.percentage || 0;
        }
      } catch (e) {
        console.error('Error calculating offline temple slab fee:', e);
      }

      totalPlatformFee += itemPlatformFee;
      itemsBreakdown.push({
        id: item.id || item.itemId,
        itemName: item.itemName || item.name,
        itemType: type,
        itemTotal,
        platformFee: itemPlatformFee,
        percentage,
      });
    }

    res.json({
      success: true,
      data: {
        itemsBreakdown,
        totalPlatformFee,
      },
    });
  } catch (error: any) {
    console.error('Calculate Temple Cart Commission Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process Unified Temple Teller Checkout (Multi-item Cart including Photography)
 */
export const processTempleTellerCheckout = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId || (req as any).templeId;
    const staffId = (req as any).user?.id || (req as any).owner?.userId;

    const { devotee, payment, items } = req.body;

    if (!templeId) {
      return res.status(400).json({ success: false, message: 'Temple context required' });
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
        itemType: item.itemType || item.type, // POOJA, DONATION, TICKET, PRODUCT, PHOTOGRAPHY
        itemId: item.itemId || item.id || null,
        itemName: item.itemName || item.name || 'Item',
        unitPrice: itemPrice,
        quantity: qty,
        totalPrice: lineTotal,
        metadata: item.metadata || item,
      });
    }

    // Generate Display ID for Temple Teller Order (e.g. TT2609070001)
    const displayId = await generateCustomId('TT');

    // 2. Execute DB Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create TellerOrder
      const tellerOrder = await tx.tellerOrder.create({
        data: {
          displayId,
          templeId,
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

      // Synchronize with domain specific tables
      for (const item of items) {
        const type = (item.itemType || item.type || '').toUpperCase();
        if (type === 'POOJA') {
          let targetPoojaId = item.itemId || item.poojaId;

          if (targetPoojaId) {
            const exists = await tx.pooja.findUnique({ where: { id: targetPoojaId } });
            if (!exists) targetPoojaId = null;
          }

          if (!targetPoojaId) {
            const firstPooja = await tx.pooja.findFirst({ where: { templeId, status: true } });
            targetPoojaId = firstPooja?.id;
          }

          if (targetPoojaId) {
            const poojaDisplayId = await generateCustomId('PB');
            await tx.poojaBooking.create({
              data: {
                displayId: poojaDisplayId,
                userId: devoteeUser!.id,
                poojaId: targetPoojaId,
                templeId,
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
                transactionRef: displayId,
              },
            });
          }
        } else if (type === 'DONATION') {
          const donDisplayId = await generateCustomId('DN');
          await tx.donation.create({
            data: {
              displayId: donDisplayId,
              userId: devoteeUser!.id,
              templeId,
              donorName: devotee.name,
              donorPhone: devotee.phone,
              donorEmail: devotee.email || '',
              amount: Number(item.price || item.amount || 0),
              status: 'SUCCESS',
              paymentMethod: payment?.method || 'CASH',
              address: devotee.address || null,
              message: item.message || 'Temple Counter Offline Donation',
            },
          });
        } else if (type === 'TICKET') {
          let targetSlotId = item.itemId || item.slotId;
          if (targetSlotId) {
            const slotExists = await tx.darshanSlot.findUnique({ where: { id: targetSlotId } });
            if (!slotExists) targetSlotId = null;
          }

          if (!targetSlotId) {
            const todayStr = new Date().toISOString().split('T')[0];
            let defaultSlot = await tx.darshanSlot.findFirst({ where: { templeId, date: todayStr } });
            if (!defaultSlot) {
              defaultSlot = await tx.darshanSlot.findFirst({ where: { templeId } });
            }
            if (!defaultSlot) {
              defaultSlot = await tx.darshanSlot.create({
                data: {
                  templeId,
                  date: todayStr,
                  startTime: '06:00',
                  endTime: '22:00',
                  maxCapacity: 1000,
                },
              });
            }
            targetSlotId = defaultSlot.id;
          }

          const ticketDisplayId = await generateCustomId('TDRID');
          await tx.darshanTicket.create({
            data: {
              displayId: ticketDisplayId,
              userId: devoteeUser!.id,
              templeId,
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
        } else if (type === 'PHOTOGRAPHY') {
          // Handle Photography Booking
          let pkgId = item.itemId || item.packageId;
          if (pkgId) {
            const exists = await tx.photographyPackage.findUnique({ where: { id: pkgId } });
            if (!exists) pkgId = null;
          }
          if (!pkgId) {
            const firstPkg = await tx.photographyPackage.findFirst({ where: { templeId, isActive: true } });
            if (firstPkg) {
              pkgId = firstPkg.id;
            } else {
              const newPkg = await tx.photographyPackage.create({
                data: {
                  templeId,
                  name: { en: item.itemName || 'Counter Photography' },
                  price: Number(item.price || item.unitPrice || 500),
                  duration: 30,
                },
              });
              pkgId = newPkg.id;
            }
          }

          let slotId = item.slotId;
          if (slotId) {
            const exists = await tx.photographySlot.findUnique({ where: { id: slotId } });
            if (!exists) slotId = null;
          }
          if (!slotId) {
            const firstSlot = await tx.photographySlot.findFirst({ where: { templeId, isActive: true } });
            if (firstSlot) {
              slotId = firstSlot.id;
            } else {
              const newSlot = await tx.photographySlot.create({
                data: {
                  templeId,
                  slotName: 'Counter General Slot',
                  maxBookingsPerDay: 50,
                },
              });
              slotId = newSlot.id;
            }
          }

          const photoDisplayId = await generateCustomId('PBK');
          await tx.photographyBooking.create({
            data: {
              displayId: photoDisplayId,
              userId: devoteeUser!.id,
              templeId,
              packageId: pkgId!,
              slotId: slotId!,
              selectedArea: item.selectedArea || 'Main Courtyard',
              bookingDate: item.bookingDate || new Date().toISOString().split('T')[0],
              timeSlot: item.timeSlot || '09:00 AM - 05:00 PM',
              packagePrice: Number(item.price || item.unitPrice || 0),
              totalAmount: Number(item.totalPrice || item.price || 0),
              status: 'BOOKED',
            },
          });
        }
      }

      // Add entry into TempleLedger for total counter collection
      await tx.templeLedger.create({
        data: {
          templeId,
          amount: totalAmount,
          grossAmount: totalAmount,
          commission: 0,
          type: LedgerType.POOJA_EARNING,
          sourceId: tellerOrder.id,
          description: `Temple Counter Checkout Receipt #${displayId} (${payment?.method || 'CASH'})`,
          status: LedgerStatus.COMPLETED,
          paymentMethod: payment?.method || 'CASH',
        } as any,
      });

      return tellerOrder;
    }, {
      timeout: 20000,
      maxWait: 10000,
    });

    res.status(201).json({
      success: true,
      message: 'Temple teller counter order processed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Temple Teller Checkout Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get All Temple Teller Orders
 */
export const getTempleTellerOrders = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId || (req as any).templeId;
    if (!templeId) {
      return res.status(400).json({ success: false, message: 'Temple context required' });
    }

    const orders = await prisma.tellerOrder.findMany({
      where: { templeId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Get Temple Teller Orders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Today's Temple Teller Counter Summary / Reports
 */
export const getTempleTellerSummary = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId || (req as any).templeId;
    if (!templeId) {
      return res.status(400).json({ success: false, message: 'Temple context required' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await prisma.tellerOrder.findMany({
      where: {
        templeId,
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
    let photoTotal = 0;

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
        else if (type === 'PHOTOGRAPHY') photoTotal += item.totalPrice;
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
          photography: photoTotal,
        },
        recentOrders: orders.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('Temple Teller Summary Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
