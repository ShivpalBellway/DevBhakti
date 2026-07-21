import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notifyUser } from '../../services/firebaseService';
import { getLang, localize, getEnglish } from '../../utils/localization';
import { triggerPrasadShiprocketOrder } from '../../utils/prasadShiprocket';
import { generateBookingDisplayId } from '../../utils/idGenerator';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { sendBookingReceiptEmail } from '../../services/bookingMailService';


export const createOfflineBookingTemple = async (req: Request, res: Response) => {
    try {
        const {
            poojaId,
            packageName,
            packagePrice,
            devoteeName,
            devoteePhone,
            devoteeEmail,
            bookingDate,
            address,
            prasadStreet,
            prasadCity,
            prasadState,
            prasadPincode,
            specialRequests,
            gothra,
            kuldevi,
            kuldevta,
            dob,
            gender,
            anniversary,
            nativePlace,
            additionalDevotees,
            paymentMethod,
            status = 'BOOKED',
            isPrasadRequested = false,
        } = req.body;

        if (!poojaId || !packageName || packagePrice === undefined || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const templeId = (req as any).owner.ownerId;
        if (!templeId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Temple ID not found in context' });
        }

        const displayId = await generateBookingDisplayId();

        // Find existing user if possible based on phone, but userId is optional
        let userId = null;
        if (devoteePhone) {
            let cleanedPhone = String(devoteePhone).replace(/\D/g, '');
            if (cleanedPhone.length === 10) cleanedPhone = '91' + cleanedPhone;
            const normalizedPhone = '+' + cleanedPhone;

            const existingUser = await prisma.user.findFirst({
                where: { phone: normalizedPhone, role: 'DEVOTEE' }
            });
            if (existingUser) {
                userId = existingUser.id;
            }
        }

        const poojaAmount = Number(packagePrice);
        const grossAmount = poojaAmount;
        const commissionAmount = 0; // Or calculate if needed
        const platformFee = 0; // Or calculate based on slabs

        const booking = await prisma.poojaBooking.create({
            data: {
                displayId,
                userId: userId,
                poojaId,
                templeId,
                packageName,
                packagePrice: poojaAmount,
                devoteeName,
                devoteePhone,
                devoteeEmail,
                bookingDate,
                address,
                prasadStreet,
                prasadCity,
                prasadState,
                prasadPincode,
                specialRequests,
                gothra,
                kuldevi,
                kuldevta,
                dob,
                gender,
                anniversary,
                nativePlace,
                additionalDevotees,
                paymentMethod,
                status,
                isPrasadRequested,
                commissionAmount,
                netEarning: grossAmount - platformFee,
                platformFee,
            },
            include: {
                pooja: true,
                temple: true
            }
        });

        // Sync Ledger
        if (status === 'BOOKED' || status === 'COMPLETED') {
            const ledgerStatus = status === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
            await prisma.templeLedger.create({
                data: {
                    templeId,
                    amount: booking.netEarning,
                    grossAmount: grossAmount,
                    commission: platformFee,
                    type: 'POOJA_EARNING',
                    sourceId: booking.id,
                    description: `Pooja Booking (${packageName})`,
                    status: ledgerStatus
                }
            });
        }

        // Send Email Confirmation
        if (devoteeEmail) {
            try {
                const devoteeEmailValue = booking.devoteeEmail ?? undefined;
                await sendBookingReceiptEmail({
                    bookingId: booking.id,
                    devoteeName: booking.devoteeName,
                    devoteePhone: booking.devoteePhone,
                    devoteeEmail: devoteeEmailValue,
                    poojaName: getEnglish(booking.pooja.name),
                    templeName: getEnglish(booking.temple?.name) || "Dev Bhakti",
                    bookingDate: booking.bookingDate || "N/A",
                    packageName: booking.packageName,
                    packagePrice: booking.packagePrice,
                    platformFee: booking.platformFee,
                    totalAmount: booking.packagePrice + booking.platformFee,
                    status: "BOOKED",
                    createdAt: booking.createdAt.toISOString(),
                    gothra: booking.gothra || undefined,
                    kuldevi: booking.kuldevi || undefined,
                    kuldevta: booking.kuldevta || undefined,
                    dob: booking.dob || undefined,
                    anniversary: booking.anniversary || undefined,
                    additionalDevotees: booking.additionalDevotees as any
                });
            } catch (emailError) {
                console.error("Failed to send offline booking email:", emailError);
            }
        }

        // Send WhatsApp Confirmation
        if (devoteePhone) {
            try {
                const phone = devoteePhone.startsWith('+') ? devoteePhone : `+91${devoteePhone}`;
                await sendWhatsAppMessage(
                    phone,
                    devoteeName,
                    "booking_confirmed",
                    [
                        devoteeName,
                        getEnglish(booking.pooja.name)
                    ]
                );
            } catch (waError) {
                console.error("Failed to send offline booking WhatsApp:", waError);
            }
        }

        res.status(200).json({ success: true, data: booking, message: "Offline Booking created successfully" });
    } catch (error: any) {
        console.error("Create Offline Booking Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTempleBookings = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner.ownerId;
        const { status, poojaId, search, startDate, endDate } = req.query;

        const where: any = {
            templeId,
            status: { not: 'PENDING' }
        };

        // Filter by Status
        if (status) {
            where.status = status;
        }

        // Filter by Pooja
        if (poojaId) {
            where.poojaId = poojaId;
        }

        // Filter by Search (Devotee Name or Phone)
        if (search) {
            where.OR = [
                { devoteeName: { contains: search as string, mode: 'insensitive' } },
                { devoteePhone: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        // Filter by Date Range (Created At)
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const bookings = await prisma.poojaBooking.findMany({
            where,
            include: {
                pooja: true,
                user: {
                    select: {
                        name: true,
                        phone: true,
                        profileImage: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const lang = getLang(req);
        res.json({
            success: true,
            data: localize(bookings, lang)
        });
    } catch (error) {
        console.error('Error fetching temple bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, prasadStatus, awbCode, trackingUrl, courierName } = req.body;

        if (status && !['PENDING', 'BOOKED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        if (prasadStatus && !['NOT_APPLICABLE', 'PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(prasadStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid prasad status' });
        }

        // Check if booking belongs to a temple owned by this user
        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string },
            include: { temple: true }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (!booking.temple || booking.temple.id !== (req as any).owner.ownerId) {

            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (prasadStatus) updateData.prasadStatus = prasadStatus;
        if (awbCode !== undefined) updateData.awbCode = awbCode;
        if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
        if (courierName !== undefined) updateData.courierName = courierName;

        // Handle proof photos if status is COMPLETED
        if (status === 'COMPLETED' && req.files && Array.isArray(req.files)) {
            const photoUrls = (req.files as Express.Multer.File[]).map(
                (file) => `${process.env.BASE_URL || ''}/uploads/proofs/${file.filename}`
            );
            updateData.proofPhotos = photoUrls;
        }

        const updatedBooking = await prisma.poojaBooking.update({
            where: { id: id as string },
            data: updateData,
            include: { pooja: true }
        });

        // Sync Ledger Status
        if (status === "COMPLETED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: id as string, type: "POOJA_EARNING" },
                data: { status: "COMPLETED" }
            });
            // Auto-trigger Prasad order creation if applicable
            if (updatedBooking.isPrasadRequested) {
                triggerPrasadShiprocketOrder(updatedBooking.id).catch(err => {
                    console.error("Failed to trigger Prasad Shiprocket Order asynchronously:", err);
                });
            }
        } else if (status === "CANCELLED" || status === "REJECTED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: id as string, type: "POOJA_EARNING" },
                data: { status: "CANCELLED" }
            });
        }

        // Notify Devotee
        const userId = booking.userId ?? undefined;
        if (status && userId) {
            await notifyUser(userId, 'devotee', {
                title: `Pooja Booking ${status === 'COMPLETED' ? 'Completed 🎊' : status === 'CANCELLED' ? 'Cancelled ❌' : status === 'REJECTED' ? 'Rejected ❌' : 'Updated'}`,
                body: `Your booking for ${getEnglish(updatedBooking.pooja.name)} has been marked as ${status.toLowerCase()}.`,
                data: { link: '/profile/bookings', bookingId: booking.id }
            });
        }

        res.json({
            success: true,
            message: `Booking status updated to ${status}`,
            data: updatedBooking
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string },
            include: { temple: true }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (!booking.temple || booking.temple.id !== (req as any).owner.ownerId) {

            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await prisma.poojaBooking.delete({
            where: { id: id as string }
        });

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
