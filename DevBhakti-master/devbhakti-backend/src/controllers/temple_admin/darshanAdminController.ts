import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { DarshanTicketStatus } from '@prisma/client';

// Update temple settings for Darshan
export const updateDarshanSettings = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const { isDarshanActive, darshanPrice } = req.body;

    const temple = await prisma.temple.update({
      where: { id: templeId },
      data: {
        isDarshanActive,
        darshanPrice: darshanPrice !== undefined ? parseFloat(darshanPrice) : undefined
      }
    });

    res.json({ message: 'Settings updated', temple });
  } catch (error) {
    console.error('Error updating darshan settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create bulk slots for date range
export const createSlots = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const { startDate, endDate, startTime, endTime, maxCapacity, intervalMinutes } = req.body;

    if (!startDate || !endDate || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsToCreate: any[] = [];

    // Helper to add days
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    // Helper to format date YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    let currentDate = start;
    while (currentDate <= end) {
      const dateStr = formatDate(currentDate);

      // Generate slots for this day
      // E.g. from startTime "08:00" to endTime "20:00" in intervals
      // Note: for a simple implementation, if intervalMinutes isn't provided,
      // just create one large block slot for the day, or fixed hourly slots.
      if (intervalMinutes) {
        let currentSlotStart = new Date(`${dateStr}T${startTime}:00Z`);
        const dayEnd = new Date(`${dateStr}T${endTime}:00Z`);

        while (currentSlotStart < dayEnd) {
          const slotEnd = new Date(currentSlotStart.getTime() + intervalMinutes * 60000);
          
          slotsToCreate.push({
            templeId,
            date: dateStr,
            startTime: currentSlotStart.toISOString().substring(11, 16),
            endTime: slotEnd.toISOString().substring(11, 16),
            maxCapacity
          });

          currentSlotStart = slotEnd;
        }
      } else {
        // Just one slot
        slotsToCreate.push({
          templeId,
          date: dateStr,
          startTime,
          endTime,
          maxCapacity
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    // Create many (ignore duplicates)
    const result = await prisma.darshanSlot.createMany({
      data: slotsToCreate,
      skipDuplicates: true
    });

    res.json({ message: `Successfully created ${result.count} slots` });
  } catch (error) {
    console.error('Error creating slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get slots for admin
export const getSlots = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const { date } = req.query;

    const query: any = { templeId };
    if (date) {
      query.date = String(date);
    }

    const temple = await prisma.temple.findUnique({
      where: { id: templeId },
      select: { darshanPrice: true, isDarshanActive: true, name: true }
    });

    const slots = await prisma.darshanSlot.findMany({
      where: query,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    const price = temple?.darshanPrice ?? 0;

    const slotsWithPrice = slots.map(slot => ({
      ...slot,
      price: price,
      darshanPrice: price,
      isDarshanActive: temple?.isDarshanActive ?? true,
      templeName: temple?.name,
      remainingCapacity: Math.max(0, slot.maxCapacity - slot.bookedCount)
    }));

    res.json(slotsWithPrice);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const templeId = (req as any).owner?.ownerId as string;

    await prisma.darshanSlot.deleteMany({
      where: { id, templeId }
    });

    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a slot (date, startTime, endTime, maxCapacity, isClosed, price, darshanPrice)
export const updateSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const templeId = (req as any).owner?.ownerId as string;
    const { date, startTime, endTime, maxCapacity, isClosed, price, darshanPrice } = req.body;

    // Verify slot belongs to this temple
    const existing = await prisma.darshanSlot.findFirst({
      where: { id, templeId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Slot not found or access denied' });
    }

    const targetDate = date || existing.date;
    const targetStartTime = startTime || existing.startTime;

    // Check for duplicate slot if startTime or date is changing
    if ((startTime && startTime !== existing.startTime) || (date && date !== existing.date)) {
      const duplicate = await prisma.darshanSlot.findFirst({
        where: {
          templeId,
          date: targetDate,
          startTime: targetStartTime,
          id: { not: id }
        }
      });
      if (duplicate) {
        return res.status(400).json({ error: `A slot starting at ${targetStartTime} already exists for ${targetDate}` });
      }
    }

    const updateData: any = {};
    if (date !== undefined)        updateData.date        = date;
    if (startTime !== undefined)   updateData.startTime   = startTime;
    if (endTime !== undefined)     updateData.endTime     = endTime;
    if (maxCapacity !== undefined) updateData.maxCapacity = Number(maxCapacity);
    if (isClosed !== undefined)    updateData.isClosed    = Boolean(isClosed);

    const updated = await prisma.darshanSlot.update({
      where: { id },
      data: updateData
    });

    const newPrice = price !== undefined ? price : darshanPrice;
    if (newPrice !== undefined) {
      await prisma.temple.update({
        where: { id: templeId },
        data: { darshanPrice: Number(newPrice) }
      });
    }

    res.json({
      message: 'Slot updated successfully',
      slot: {
        ...updated,
        price: newPrice !== undefined ? Number(newPrice) : undefined,
        darshanPrice: newPrice !== undefined ? Number(newPrice) : undefined
      }
    });
  } catch (error: any) {
    console.error('Error updating slot:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A slot with this start time already exists for this date.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// List tickets
export const getTickets = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const { date, status, search } = req.query;

    const query: any = { templeId };

    if (date) {
      query.slot = { date: String(date) };
    }
    if (status) {
      query.status = status as DarshanTicketStatus;
    }
    if (search) {
      const searchStr = String(search);
      query.OR = [
        { displayId: { contains: searchStr, mode: 'insensitive' } },
        { visitorName: { contains: searchStr, mode: 'insensitive' } },
        { visitorPhone: { contains: searchStr } }
      ];
    }

    const tickets = await prisma.darshanTicket.findMany({
      where: query,
      include: {
        slot: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Scan QR Token
export const scanTicket = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const { userId } = (req as any).user; // The staff/admin scanning
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ error: 'QR Token is required' });
    }

    const ticket = await prisma.darshanTicket.findFirst({
      where: {
        OR: [
          { qrToken },
          { displayId: qrToken }
        ]
      },
      include: { slot: true }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Invalid QR Pass' });
    }

    if (ticket.templeId !== templeId) {
      return res.status(403).json({ error: 'Pass is for a different temple' });
    }

    if (ticket.status === DarshanTicketStatus.USED) {
      return res.status(400).json({ error: 'Pass has already been used' });
    }
    if (ticket.status === DarshanTicketStatus.EXPIRED) {
      return res.status(400).json({ error: 'Pass is expired' });
    }
    if (ticket.status === DarshanTicketStatus.PENDING) {
      return res.status(400).json({ error: 'Pass payment is incomplete' });
    }

    // Ideally check if today's date matches ticket.slot.date, but allowing small tolerance is good
    const today = new Date().toISOString().split('T')[0];
    if (ticket.slot.date !== today) {
       // Could warn or reject. Let's warn but not strictly block, or block if strict.
       // return res.status(400).json({ error: `Pass is valid for ${ticket.slot.date}, not today` });
    }

    // Mark as used
    const updatedTicket = await prisma.darshanTicket.update({
      where: { id: ticket.id },
      data: {
        status: DarshanTicketStatus.USED,
        scannedAt: new Date(),
        scannedBy: userId
      },
      include: { slot: true }
    });

    res.json({ message: 'Access Granted', ticket: updatedTicket });
  } catch (error) {
    console.error('Error scanning ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create offline Darshan Ticket by Temple Admin / Teller
export const createOfflineTicket = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner?.ownerId;
    const {
      slotId,
      visitorName,
      visitorPhone,
      visitorEmail,
      visitorCount,
      paymentMode,
      paymentReference,
      notes
    } = req.body;

    if (!slotId || !visitorName || !visitorPhone || !visitorCount) {
      return res.status(400).json({ error: 'Slot ID, Visitor Name, Phone, and Count are required' });
    }

    const count = parseInt(visitorCount);
    if (isNaN(count) || count <= 0) {
      return res.status(400).json({ error: 'Invalid visitor count' });
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const slot = await tx.darshanSlot.findUnique({
        where: { id: slotId }
      });

      if (!slot) {
        throw new Error('Darshan Slot not found');
      }

      if (slot.templeId !== templeId) {
        throw new Error('Slot belongs to a different temple');
      }

      if (slot.isClosed || slot.bookedCount + count > slot.maxCapacity) {
        throw new Error('Slot capacity full or slot is closed');
      }

      const temple = await tx.temple.findUnique({
        where: { id: templeId }
      });

      if (!temple || !temple.isDarshanActive) {
        throw new Error('Darshan is not active for this temple');
      }

      const totalAmount = temple.darshanPrice * count;

      // Update slot capacity count
      await tx.darshanSlot.update({
        where: { id: slotId },
        data: {
          bookedCount: { increment: count }
        }
      });

      // Find or create devotee user for userId
      let userId: string;
      const cleanedPhone = visitorPhone.replace(/\D/g, '');
      const normalizedPhone = cleanedPhone.length === 10 ? `+91${cleanedPhone}` : `+${cleanedPhone}`;

      const existingUser = await tx.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: cleanedPhone },
            { phone: visitorPhone }
          ],
          role: 'DEVOTEE'
        }
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const userDisplayId = `DEV-${Date.now().toString().slice(-6)}`;
        const newUser = await tx.user.create({
          data: {
            displayId: userDisplayId,
            name: visitorName,
            phone: normalizedPhone,
            email: visitorEmail || null,
            role: 'DEVOTEE',
            isVerified: true,
            isActive: true,
          }
        });
        userId = newUser.id;
      }

      const { generateCustomId } = await import('../../utils/idGenerator');
      const displayId = await generateCustomId('DRID');

      const newTicket = await tx.darshanTicket.create({
        data: {
          displayId,
          userId,
          templeId,
          slotId,
          visitorName,
          visitorPhone,
          visitorEmail: visitorEmail || null,
          visitorCount: count,
          totalAmount,
          platformFee: 0,
          commissionAmount: 0,
          netEarning: totalAmount,
          status: DarshanTicketStatus.CONFIRMED,
          qrToken: displayId
        },
        include: { slot: true }
      });

      return newTicket;
    });

    res.status(201).json({
      message: 'Offline Darshan Ticket issued successfully',
      ticket
    });
  } catch (error: any) {
    console.error('Error issuing offline ticket:', error);
    res.status(400).json({ error: error.message || 'Failed to issue ticket' });
  }
};

