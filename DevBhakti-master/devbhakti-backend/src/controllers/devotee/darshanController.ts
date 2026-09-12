import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import razorpay from '../../lib/razorpay';
import { getCommissionForAmount } from '../admin/commissionSlabController';
import { CommissionCategory, SlabType, DarshanTicketStatus } from '@prisma/client';
import { generateCustomId } from '../../utils/idGenerator';

// Get available slots for a given date
export const getSlots = async (req: Request, res: Response) => {
  try {
    const { templeId } = req.params;
    const { date } = req.query;

    if (!templeId || !date) {
      return res.status(400).json({ error: 'Temple ID and date are required' });
    }

    const temple = await prisma.temple.findUnique({
      where: { id: String(templeId) },
      select: { isDarshanActive: true, darshanPrice: true }
    });

    if (!temple || !temple.isDarshanActive) {
      return res.status(404).json({ error: 'Darshan is not active for this temple' });
    }

    const slots = await prisma.darshanSlot.findMany({
      // where: {
      //   templeId,
      //   date: String(date),
      //   isClosed: false
      // },
      orderBy: { startTime: 'asc' }
    });

    // Calculate remaining capacity
    const slotsWithCapacity = slots.map(slot => ({
      ...slot,
      remainingCapacity: Math.max(0, slot.maxCapacity - slot.bookedCount)
    }));

    res.json({
      price: temple.darshanPrice,
      slots: slotsWithCapacity
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Book a darshan ticket
export const bookDarshan = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const {
      slotId,
      templeId,
      visitorName,
      visitorPhone,
      visitorEmail,
      visitorCount
    } = req.body;

    if (!slotId || !templeId || !visitorName || !visitorPhone || !visitorCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if slot has capacity (using transaction)
    const ticket = await prisma.$transaction(async (tx) => {
      const slot = await tx.darshanSlot.findUnique({
        where: { id: slotId }
      });

      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.isClosed || slot.bookedCount + visitorCount > slot.maxCapacity) {
        throw new Error('Slot is fully booked or closed');
      }

      const temple = await tx.temple.findUnique({
        where: { id: templeId }
      });

      if (!temple || !temple.isDarshanActive) {
        throw new Error('Darshan is not available for this temple');
      }

      // Increment bookedCount
      await tx.darshanSlot.update({
        where: { id: slotId },
        data: {
          bookedCount: {
            increment: visitorCount
          }
        }
      });

      const totalAmount = temple.darshanPrice * visitorCount;
      
      let commissionAmount = 0;
      let platformFee = 0;
      let netEarning = totalAmount;

      if (totalAmount > 0) {
        const commissionData = await getCommissionForAmount(
          totalAmount,
          SlabType.TEMPLE,
          templeId,
          CommissionCategory.DARSHAN
        );
        commissionAmount = commissionData.totalCommission;
        platformFee = commissionData.platformFee;
        netEarning = totalAmount - commissionAmount - platformFee;
      }

      const displayId = await generateCustomId('DRID');

      // Create ticket
      const newTicket = await tx.darshanTicket.create({
        data: {
          displayId,
          userId,
          slotId,
          templeId,
          visitorName,
          visitorPhone,
          visitorEmail,
          visitorCount,
          totalAmount,
          platformFee,
          commissionAmount,
          netEarning,
          status: DarshanTicketStatus.PENDING
        }
      });

      return newTicket;
    });

    if (ticket.totalAmount > 0) {
      // Create Razorpay order
      const options = {
        amount: Math.round(ticket.totalAmount * 100), // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: ticket.id,
        notes: {
          orderType: 'DARSHAN',
          ticketId: ticket.id
        }
      };

      const order = await razorpay.orders.create(options);

      res.status(201).json({
        message: 'Order created',
        ticket,
        order
      });
    } else {
      // If price is 0, auto confirm (defensive coding)
      const confirmedTicket = await prisma.darshanTicket.update({
        where: { id: ticket.id },
        data: { status: DarshanTicketStatus.CONFIRMED }
      });
      res.status(201).json({
        message: 'Ticket confirmed automatically',
        ticket: confirmedTicket
      });
    }

  } catch (error: any) {
    console.error('Error booking darshan:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    
    // Fetch temple darshan tickets
    const templeTickets = await prisma.darshanTicket.findMany({
      where: { userId },
      include: {
        slot: true,
        temple: {
          select: { name: true, image: true, fullAddress: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch mandal darshan tickets (issued via teller or online)
    const mandalTickets = await prisma.mandalDarshanTicket.findMany({
      where: { userId },
      include: {
        slot: true,
        mandal: {
          select: { name: true, image: true, address: true, city: true, state: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Normalise mandal tickets to a common shape so frontend doesn't need extra logic
    const normalisedMandalTickets = mandalTickets.map((t: any) => ({
      ...t,
      _type: 'MANDAL',          // flag so frontend can differentiate
      temple: null,             // no temple
      mandalName: t.mandal?.name || null,
      mandalImage: t.mandal?.image || null,
      mandalAddress: [t.mandal?.address, t.mandal?.city, t.mandal?.state].filter(Boolean).join(', ') || null,
    }));

    const normalisedTempleTickets = templeTickets.map((t: any) => ({
      ...t,
      _type: 'TEMPLE',
      mandal: null,
    }));

    // Merge and sort by createdAt desc
    const allTickets = [...normalisedTempleTickets, ...normalisedMandalTickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(allTickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getTicketDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any).user;

    const ticket = await prisma.darshanTicket.findFirst({
      where: { 
        id: String(id),
        userId // Ensure user owns the ticket
      },
      include: {
        slot: true,
        temple: {
          select: { name: true, fullAddress: true, phone: true }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
