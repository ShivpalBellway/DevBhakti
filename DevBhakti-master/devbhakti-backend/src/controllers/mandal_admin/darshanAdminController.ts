import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { DarshanTicketStatus } from '@prisma/client';

// Generate bulk slots
export const createSlots = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const { startDate, endDate, startTime, endTime, maxCapacity, intervalMinutes, title, price } = req.body;

    if (!startDate || !endDate || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (startDate < todayStr) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    if (endDate < startDate) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const slotTitle = title && title.trim() ? title.trim() : "General Darshan Ticket";
    const slotPrice = price !== undefined && price !== null && price !== "" ? Number(price) : 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsToCreate: any[] = [];

    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    let currentDate = start;
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      if (intervalMinutes) {
        let currentSlotStart = new Date(`${dateStr}T${startTime}:00Z`);
        const dayEnd = new Date(`${dateStr}T${endTime}:00Z`);

        while (currentSlotStart < dayEnd) {
          const slotEnd = new Date(currentSlotStart.getTime() + intervalMinutes * 60000);
          
          slotsToCreate.push({
            mandalId,
            date: dateStr,
            startTime: currentSlotStart.toISOString().substring(11, 16),
            endTime: slotEnd.toISOString().substring(11, 16),
            title: slotTitle,
            price: slotPrice,
            maxCapacity
          });

          currentSlotStart = slotEnd;
        }
      } else {
        slotsToCreate.push({
          mandalId,
          date: dateStr,
          startTime,
          endTime,
          title: slotTitle,
          price: slotPrice,
          maxCapacity
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    const result = await prisma.mandalDarshanSlot.createMany({
      data: slotsToCreate,
      skipDuplicates: true
    });

    res.json({ message: `Successfully created ${result.count} slots` });
  } catch (error) {
    console.error('Error creating slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get slots
export const getSlots = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const { date } = req.query;

    const query: any = { mandalId };
    if (date) {
      query.date = String(date);
    }

    const slots = await prisma.mandalDarshanSlot.findMany({
      where: query,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    const slotsWithCapacity = slots.map(slot => ({
      ...slot,
      remainingCapacity: Math.max(0, slot.maxCapacity - slot.bookedCount)
    }));

    res.json(slotsWithCapacity);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const mandalId = (req as any).owner?.ownerId as string;

    await prisma.mandalDarshanSlot.deleteMany({
      where: { id, mandalId }
    });

    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a slot (date, title, price, maxCapacity, times, isClosed)
export const updateSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const mandalId = (req as any).owner?.ownerId as string;
    const { date, title, price, maxCapacity, startTime, endTime, isClosed } = req.body;

    // Verify slot belongs to this mandal
    const existing = await prisma.mandalDarshanSlot.findFirst({
      where: { id, mandalId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Slot not found or access denied' });
    }

    const targetDate = date || existing.date;
    const targetStartTime = startTime || existing.startTime;

    if ((startTime && startTime !== existing.startTime) || (date && date !== existing.date)) {
      const duplicate = await prisma.mandalDarshanSlot.findFirst({
        where: {
          mandalId,
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
    if (title !== undefined)       updateData.title       = title;
    if (price !== undefined)       updateData.price       = Number(price);
    if (maxCapacity !== undefined) updateData.maxCapacity = Number(maxCapacity);
    if (startTime !== undefined)   updateData.startTime   = startTime;
    if (endTime !== undefined)     updateData.endTime     = endTime;
    if (isClosed !== undefined)    updateData.isClosed    = Boolean(isClosed);

    const updated = await prisma.mandalDarshanSlot.update({
      where: { id },
      data: updateData
    });

    res.json({ message: 'Slot updated successfully', slot: updated });
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
    const mandalId = (req as any).owner?.ownerId;
    const { date, status, search } = req.query;

    const query: any = { mandalId };

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

    const tickets = await prisma.mandalDarshanTicket.findMany({
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

// Create offline Darshan Ticket by Mandal Admin / Teller
export const createOfflineTicket = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId;
    const {
      slotId,
      visitorName,
      visitorPhone,
      visitorEmail,
      visitorCount,
      paymentMode,
      paymentMethod,
      paymentReference,
      notes,
      amount
    } = req.body;

    if (!visitorName || !visitorPhone || !visitorCount) {
      return res.status(400).json({ error: 'Visitor Name, Phone, and Count are required' });
    }

    const count = parseInt(visitorCount);
    if (isNaN(count) || count <= 0) {
      return res.status(400).json({ error: 'Invalid visitor count' });
    }

    const totalAmount = parseFloat(amount) || 0;

    const ticket = await prisma.$transaction(async (tx) => {
      let slot;
      
      if (slotId) {
        slot = await tx.mandalDarshanSlot.findUnique({
          where: { id: slotId }
        });
        if (!slot) throw new Error('Darshan Slot not found');
        if (slot.mandalId !== mandalId) throw new Error('Slot belongs to a different mandal');
      } else {
        const today = new Date().toISOString().split('T')[0];
        slot = await tx.mandalDarshanSlot.findFirst({
          where: { mandalId, date: today }
        });
        
        if (!slot) {
          slot = await tx.mandalDarshanSlot.create({
            data: {
              mandalId,
              date: today,
              startTime: '00:00',
              endTime: '23:59',
              maxCapacity: 100000,
            }
          });
        }
      }

      if (slot.isClosed || slot.bookedCount + count > slot.maxCapacity) {
        throw new Error('Slot capacity full or slot is closed');
      }

      // Update slot capacity count
      await tx.mandalDarshanSlot.update({
        where: { id: slot.id },
        data: {
          bookedCount: { increment: count }
        }
      });

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
      const displayId = await generateCustomId('MDRID');

      const newTicket = await tx.mandalDarshanTicket.create({
        data: {
          displayId,
          userId,
          mandalId,
          slotId: slot.id,
          visitorName,
          visitorPhone,
          visitorEmail: visitorEmail || null,
          visitorCount: count,
          totalAmount,
          status: DarshanTicketStatus.CONFIRMED,
          paymentMethod: paymentMethod || paymentMode || 'CASH',
        },
        include: { slot: true }
      });
      
      // Log earnings conceptually if totalAmount > 0
      if (totalAmount > 0) {
        await tx.mandalLedger.create({
          data: {
            mandalId,
            amount: totalAmount,
            grossAmount: totalAmount,
            type: 'DARSHAN_EARNING',
            sourceId: newTicket.id,
            description: `Offline Darshan Ticket (${count} visitors)`,
            status: 'COMPLETED'
          }
        });
      }

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
