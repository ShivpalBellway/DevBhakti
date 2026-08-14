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
            paymentMethod = 'CASH',
            transactionRef,
            adminNotes,
            status = 'BOOKED',
            isPrasadRequested = false,
        } = req.body;

        if (!poojaId || !packageName || packagePrice === undefined || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const templeId = (req as any).owner?.ownerId;
        if (!templeId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Temple ID not found in context' });
        }

        const displayId = await generateBookingDisplayId();

        // Automatic Devotee User Creation / Lookup
        let userId: string | null = null;
        let cleanedPhone = String(devoteePhone).replace(/\D/g, '');
        if (cleanedPhone.length === 10) cleanedPhone = '91' + cleanedPhone;
        const normalizedPhone = '+' + cleanedPhone;

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: normalizedPhone },
                    { phone: cleanedPhone },
                    { phone: devoteePhone }
                ],
                role: 'DEVOTEE'
            }
        });

        if (existingUser) {
            userId = existingUser.id;
            // Update profile with missing details if provided
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    name: existingUser.name || devoteeName,
                    email: existingUser.email || devoteeEmail || null,
                    gothra: existingUser.gothra || gothra || null,
                    kuldevi: existingUser.kuldevi || kuldevi || null,
                    kuldevta: existingUser.kuldevta || kuldevta || null,
                    address: existingUser.address || address || null,
                    dob: existingUser.dob || dob || null,
                    anniversary: existingUser.anniversary || anniversary || null,
                    nativePlace: existingUser.nativePlace || nativePlace || null
                }
            });
        } else {
            // Auto-create new DEVOTEE user account
            const userDisplayId = `DEV-${Date.now().toString().slice(-6)}`;
            const newUser = await prisma.user.create({
                data: {
                    displayId: userDisplayId,
                    name: devoteeName,
                    phone: normalizedPhone,
                    email: devoteeEmail || null,
                    role: 'DEVOTEE',
                    isVerified: true,
                    isActive: true,
                    gothra: gothra || null,
                    kuldevi: kuldevi || null,
                    kuldevta: kuldevta || null,
                    address: address || null,
                    dob: dob || null,
                    anniversary: anniversary || null,
                    nativePlace: nativePlace || null
                }
            });
            userId = newUser.id;
        }

        // Auto Sync Lead
        if (normalizedPhone) {
            try {
                const existingLead = await prisma.lead.findFirst({
                    where: { phone: normalizedPhone }
                });
                if (!existingLead) {
                    await prisma.lead.create({
                        data: {
                            name: devoteeName,
                            phone: normalizedPhone,
                            email: devoteeEmail || null,
                            source: 'POOJA_BOOKING',
                            status: 'CONVERTED',
                            notes: `Temple Offline Pooja Booking (${packageName})`,
                            metadata: { offlineBooking: true, templeId, bookingDisplayId: displayId }
                        }
                    });
                } else {
                    await prisma.lead.update({
                        where: { id: existingLead.id },
                        data: {
                            status: 'CONVERTED',
                            notes: existingLead.notes ? `${existingLead.notes} | Temple Offline Pooja (${packageName})` : `Temple Offline Pooja (${packageName})`
                        }
                    });
                }
            } catch (leadError) {
                console.error("Lead sync warning:", leadError);
            }
        }

        const poojaAmount = Number(packagePrice);
        const grossAmount = poojaAmount;
        const commissionAmount = 0;
        const platformFee = 0;

        const booking = await prisma.poojaBooking.create({
            data: {
                displayId,
                userId: userId,
                poojaId,
                templeId,
                packageName,
                packagePrice: poojaAmount,
                devoteeName,
                devoteePhone: normalizedPhone || devoteePhone,
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
                isOffline: true,
                bookingSource: 'TEMPLE_OFFLINE',
                transactionRef: transactionRef || null,
                createdByStaffId: (req as any).owner?.staffId || null,
                adminNotes: adminNotes || null,
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
            await prisma.templeLedger.create({
                data: {
                    templeId,
                    amount: booking.netEarning,
                    grossAmount: grossAmount,
                    commission: platformFee,
                    type: 'POOJA_EARNING',
                    sourceId: booking.id,
                    description: `Offline Pooja Booking (${packageName}) - Ref: ${transactionRef || paymentMethod}`,
                    status: 'COMPLETED'
                }
            });
        }

        // Audit Log
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'CREATE_TEMPLE_OFFLINE_POOJA_BOOKING',
                    module: 'POOJA_BOOKING',
                    entityId: booking.id,
                    performedBy: (req as any).owner?.staffId || templeId,
                    userRole: 'TEMPLE_ADMIN',
                    details: {
                        displayId: booking.displayId,
                        devoteeName: booking.devoteeName,
                        devoteePhone: booking.devoteePhone,
                        packagePrice: booking.packagePrice,
                        paymentMethod: booking.paymentMethod,
                        transactionRef: transactionRef || null
                    },
                    ipAddress: req.ip || null
                }
            });
        } catch (auditErr) {
            console.error("Audit log error:", auditErr);
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

export const getTempleOfflinePoojaLeads = async (req: Request, res: Response) => {
    try {
        const templeId = (req as any).owner?.ownerId;
        if (!templeId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Temple ID missing' });
        }

        const { search, page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(String(page), 10) || 1;
        const limitNum = parseInt(String(limit), 10) || 50;
        const skip = (pageNum - 1) * limitNum;

        const bookingWhere: any = {
            templeId: String(templeId),
            OR: [
                { isOffline: true },
                { bookingSource: { in: ['ADMIN_OFFLINE', 'TEMPLE_OFFLINE', 'COUNTER'] } }
            ]
        };

        const donationWhere: any = {
            templeId: String(templeId),
            razorpayOrderId: null
        };

        if (search) {
            const queryStr = String(search);
            bookingWhere.AND = [
                {
                    OR: [
                        { devoteeName: { contains: queryStr, mode: 'insensitive' } },
                        { devoteePhone: { contains: queryStr, mode: 'insensitive' } },
                        { devoteeEmail: { contains: queryStr, mode: 'insensitive' } },
                        { displayId: { contains: queryStr, mode: 'insensitive' } }
                    ]
                }
            ];
            donationWhere.AND = [
                {
                    OR: [
                        { donorName: { contains: queryStr, mode: 'insensitive' } },
                        { donorPhone: { contains: queryStr, mode: 'insensitive' } },
                        { donorEmail: { contains: queryStr, mode: 'insensitive' } },
                        { displayId: { contains: queryStr, mode: 'insensitive' } }
                    ]
                }
            ];
        }

        const [offlineBookings, offlineDonations] = await Promise.all([
            prisma.poojaBooking.findMany({
                where: bookingWhere,
                orderBy: { createdAt: 'desc' },
                include: {
                    pooja: { select: { name: true } },
                    user: { select: { id: true, displayId: true, isVerified: true, address: true } }
                }
            }),
            prisma.donation.findMany({
                where: donationWhere,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, displayId: true, isVerified: true, address: true } }
                }
            })
        ]);

        const leadsMap = new Map<string, any>();

        const getLeadEntry = (rawPhone: string, fallbackName: string, fallbackEmail?: string | null, fallbackAddress?: string | null, userObj?: any, createdAtDate?: Date) => {
            let cleaned = String(rawPhone || '').replace(/\D/g, '');
            if (cleaned.length === 10) cleaned = '91' + cleaned;
            const phoneKey = cleaned ? '+' + cleaned : (rawPhone || 'UNKNOWN');

            if (!leadsMap.has(phoneKey)) {
                leadsMap.set(phoneKey, {
                    phone: phoneKey,
                    name: fallbackName,
                    email: fallbackEmail || null,
                    address: fallbackAddress || userObj?.address || null,
                    gothra: null,
                    kuldevi: null,
                    kuldevta: null,
                    dob: null,
                    anniversary: null,
                    nativePlace: null,
                    userId: userObj?.id || null,
                    userDisplayId: userObj?.displayId || null,
                    totalBookings: 0,
                    totalDonations: 0,
                    totalBookedAmount: 0,
                    totalDonatedAmount: 0,
                    totalSpent: 0,
                    createdAt: createdAtDate || new Date(),
                    lastActivityDate: createdAtDate || new Date(),
                    bookings: [],
                    donations: [],
                    history: []
                });
            }
            return leadsMap.get(phoneKey);
        };

        // Process Pooja Bookings
        offlineBookings.forEach((booking) => {
            const lead = getLeadEntry(
                booking.devoteePhone,
                booking.devoteeName,
                booking.devoteeEmail,
                booking.address,
                booking.user,
                booking.createdAt
            );

            if (!lead.name || lead.name === 'Devotee') lead.name = booking.devoteeName;
            if (!lead.email && booking.devoteeEmail) lead.email = booking.devoteeEmail;
            if (!lead.address && booking.address) lead.address = booking.address;
            if (!lead.gothra && booking.gothra) lead.gothra = booking.gothra;
            if (!lead.kuldevi && booking.kuldevi) lead.kuldevi = booking.kuldevi;
            if (!lead.kuldevta && booking.kuldevta) lead.kuldevta = booking.kuldevta;
            if (!lead.dob && booking.dob) lead.dob = booking.dob;
            if (!lead.anniversary && booking.anniversary) lead.anniversary = booking.anniversary;
            if (!lead.nativePlace && booking.nativePlace) lead.nativePlace = booking.nativePlace;
            if (!lead.userId && booking.userId) lead.userId = booking.userId;
            if (!lead.userDisplayId && booking.user?.displayId) lead.userDisplayId = booking.user.displayId;

            if (new Date(booking.createdAt) < new Date(lead.createdAt)) {
                lead.createdAt = booking.createdAt;
            }

            lead.totalBookings += 1;
            lead.totalBookedAmount += (booking.packagePrice || 0);
            lead.totalSpent += (booking.packagePrice || 0);

            const item = {
                id: booking.id,
                itemType: 'POOJA',
                displayId: booking.displayId,
                title: booking.pooja?.name,
                poojaName: booking.pooja?.name,
                packageName: booking.packageName,
                bookingDate: booking.bookingDate,
                amount: booking.packagePrice,
                packagePrice: booking.packagePrice,
                paymentMethod: booking.paymentMethod,
                transactionRef: booking.transactionRef,
                status: booking.status,
                createdAt: booking.createdAt
            };

            lead.bookings.push(item);
            lead.history.push(item);
        });

        // Process Offline Donations
        offlineDonations.forEach((donation) => {
            const lead = getLeadEntry(
                donation.donorPhone,
                donation.donorName,
                donation.donorEmail,
                donation.address,
                donation.user,
                donation.createdAt
            );

            if (!lead.name || lead.name === 'Donor') lead.name = donation.donorName;
            if (!lead.email && donation.donorEmail) lead.email = donation.donorEmail;
            if (!lead.address && donation.address) lead.address = donation.address;
            if (!lead.userId && donation.userId) lead.userId = donation.userId;
            if (!lead.userDisplayId && donation.user?.displayId) lead.userDisplayId = donation.user.displayId;

            if (new Date(donation.createdAt) < new Date(lead.createdAt)) {
                lead.createdAt = donation.createdAt;
            }

            lead.totalDonations += 1;
            lead.totalDonatedAmount += (donation.amount || 0);
            lead.totalSpent += (donation.amount || 0);

            const item = {
                id: donation.id,
                itemType: 'DONATION',
                displayId: donation.displayId || donation.id,
                title: 'Offline Sacred Donation',
                amount: donation.amount,
                paymentMethod: donation.paymentMethod || 'CASH',
                status: donation.status,
                createdAt: donation.createdAt,
                donorEmail: donation.donorEmail,
                panNumber: donation.panNumber,
                message: donation.message
            };

            lead.donations.push(item);
            lead.history.push(item);
        });

        // Sort history by date desc for each lead
        leadsMap.forEach((lead) => {
            lead.history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });

        const allLeads = Array.from(leadsMap.values());
        allLeads.sort((a, b) => new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime());

        const paginatedLeads = allLeads.slice(skip, skip + limitNum);

        const totalBookingsAmount = offlineBookings.reduce((sum, b) => sum + (b.packagePrice || 0), 0);
        const totalDonatedAmount = offlineDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

        return res.status(200).json({
            success: true,
            data: paginatedLeads,
            totalLeads: allLeads.length,
            totalBookingsCount: offlineBookings.length,
            totalDonationsCount: offlineDonations.length,
            totalBookingsAmount,
            totalDonatedAmount,
            totalRevenue: totalBookingsAmount + totalDonatedAmount,
            page: pageNum,
            limit: limitNum
        });
    } catch (error: any) {
        console.error("Get temple offline pooja leads error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

