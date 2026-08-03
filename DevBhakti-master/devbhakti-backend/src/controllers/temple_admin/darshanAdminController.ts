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

    const slots = await prisma.darshanSlot.findMany({
      where: query,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    res.json(slots);
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
