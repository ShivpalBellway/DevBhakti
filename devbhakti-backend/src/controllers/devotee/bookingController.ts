import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const createBooking = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const {
            poojaId,
            packageName,
            packagePrice,
            devoteeName,
            devoteePhone,
            devoteeEmail,
            bookingDate,
            address,
            specialRequests
        } = req.body;

        if (!poojaId || !packageName || !packagePrice || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Get pooja and temple commission rate
        const pooja = await prisma.pooja.findUnique({
            where: { id: poojaId },
            include: {
                temple: {
                    select: {
                        id: true,
                        poojaCommissionRate: true
                    }
                }
            }
        });

        if (!pooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }

        const commissionRate = pooja.temple?.poojaCommissionRate || 5.0;
        const commissionAmount = (packagePrice * commissionRate) / 100;
        const netEarning = packagePrice - commissionAmount;

        // Create booking and ledger entry in a transaction
        const booking = await prisma.$transaction(async (tx) => {
            const newBooking = await tx.poojaBooking.create({
                data: {
                    userId,
                    poojaId,
                    templeId: pooja.templeId,
                    packageName,
                    packagePrice,
                    devoteeName,
                    devoteePhone,
                    devoteeEmail,
                    bookingDate,
                    address,
                    specialRequests,
                    status: 'BOOKED',
                    commissionAmount,
                    netEarning
                }
            });

            // Create ledger entry for temple
            await tx.templeLedger.create({
                data: {
                    templeId: pooja.templeId,
                    amount: netEarning,
                    grossAmount: packagePrice,
                    commission: commissionAmount,
                    type: "POOJA_EARNING",
                    sourceId: newBooking.id,
                    description: `Pooja Booking: ${pooja.name} (${packageName})`,
                    status: "PENDING"
                }
            });

            return newBooking;
        });

        res.status(201).json({
            success: true,
            message: 'Pooja booked successfully',
            data: booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getMyBookings = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;

        const bookings = await prisma.poojaBooking.findMany({
            where: { userId },
            include: {
                pooja: true,
                temple: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching my bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
