import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { generateBookingDisplayId } from '../../utils/idGenerator';
import { getLang, localize, getEnglish } from '../../utils/localization';
import { notifyUser } from '../../services/firebaseService';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { sendBookingReceiptEmail } from '../../services/bookingMailService';

export const getMandalBookings = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId;
        const { status, poojaId, search, startDate, endDate } = req.query;

        const where: any = {
            mandalId,
            status: { not: 'PENDING' }
        };

        if (status) where.status = status;
        if (poojaId) where.poojaId = poojaId;
        if (search) {
            where.OR = [
                { devoteeName: { contains: String(search), mode: 'insensitive' } },
                { devoteePhone: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) where.createdAt.lte = new Date(String(endDate));
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
            orderBy: { createdAt: 'desc' }
        });

        const lang = getLang(req);
        res.json({ success: true, data: localize(bookings, lang) });
    } catch (error: any) {
        console.error('Error fetching mandal bookings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMandalBookingById = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId as string;
        const id = req.params.id as string;

        const booking = await prisma.poojaBooking.findFirst({
            where: { id, mandalId },
            include: {
                pooja: true,
                user: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const lang = getLang(req);
        res.json({ success: true, data: localize(booking, lang) });
    } catch (error: any) {
        console.error('Error fetching mandal booking by id:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMandalBooking = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner.ownerId as string;
        const id = req.params.id as string;

        const booking = await prisma.poojaBooking.findFirst({
            where: { id, mandalId }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        await prisma.poojaBooking.delete({ where: { id } });

        try {
            await prisma.auditLog.create({
                data: {
                    action: 'DELETE_MANDAL_BOOKING',
                    module: 'POOJA_BOOKING',
                    entityId: id,
                    performedBy: (req as any).owner?.staffId || mandalId,
                    userRole: 'MANDAL_ADMIN',
                    details: {
                        displayId: booking.displayId,
                        devoteeName: booking.devoteeName,
                        devoteePhone: booking.devoteePhone
                    },
                    ipAddress: req.ip || null
                }
            });
        } catch (auditErr) {
            console.error('Audit log error:', auditErr);
        }

        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting mandal booking:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createOfflineBookingMandal = async (req: Request, res: Response) => {
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

        const mandalId = (req as any).owner?.ownerId;
        if (!mandalId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Mandal ID not found in context' });
        }

        const displayId = await generateBookingDisplayId();
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

        if (normalizedPhone) {
            try {
                const existingLead = await prisma.lead.findFirst({ where: { phone: normalizedPhone } });
                if (!existingLead) {
                    await prisma.lead.create({
                        data: {
                            name: devoteeName,
                            phone: normalizedPhone,
                            email: devoteeEmail || null,
                            source: 'POOJA_BOOKING',
                            status: 'CONVERTED',
                            notes: `Mandal Offline Pooja Booking (${packageName})`,
                            metadata: { offlineBooking: true, mandalId, bookingDisplayId: displayId }
                        }
                    });
                } else {
                    await prisma.lead.update({
                        where: { id: existingLead.id },
                        data: {
                            status: 'CONVERTED',
                            notes: existingLead.notes ? `${existingLead.notes} | Mandal Offline Pooja (${packageName})` : `Mandal Offline Pooja (${packageName})`
                        }
                    });
                }
            } catch (leadError) {
                console.error('Lead sync warning:', leadError);
            }
        }

        const poojaAmount = Number(packagePrice);
        const grossAmount = poojaAmount;
        const platformFee = 0;

        const booking = await prisma.poojaBooking.create({
            data: {
                displayId,
                userId,
                poojaId,
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
                bookingSource: 'MANDAL_OFFLINE',
                transactionRef: transactionRef || null,
                createdByStaffId: (req as any).owner?.staffId || null,
                adminNotes: adminNotes || null,
                status,
                isPrasadRequested,
                commissionAmount: 0,
                netEarning: grossAmount - platformFee,
                platformFee,
                mandalId,
            },
            include: {
                pooja: true,
                mandal: true
            }
        });

        if (status === 'BOOKED' || status === 'COMPLETED') {
            await prisma.mandalLedger.create({
                data: {
                    mandalId,
                    amount: booking.netEarning,
                    grossAmount,
                    commission: platformFee,
                    type: 'POOJA_EARNING',
                    sourceId: booking.id,
                    description: `Offline Pooja Booking (${packageName}) - Ref: ${transactionRef || paymentMethod}`,
                    status: 'COMPLETED'
                }
            });
        }

        try {
            await prisma.auditLog.create({
                data: {
                    action: 'CREATE_MANDAL_OFFLINE_POOJA_BOOKING',
                    module: 'POOJA_BOOKING',
                    entityId: booking.id,
                    performedBy: (req as any).owner?.staffId || mandalId,
                    userRole: 'MANDAL_ADMIN',
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
            console.error('Audit log error:', auditErr);
        }

        if (devoteeEmail) {
            try {
                await sendBookingReceiptEmail({
                    bookingId: booking.id,
                    devoteeName: booking.devoteeName,
                    devoteePhone: booking.devoteePhone,
                    devoteeEmail: booking.devoteeEmail ?? undefined,
                    poojaName: getEnglish(booking.pooja.name),
                    templeName: booking.mandal?.name ? getEnglish(booking.mandal.name) : 'Dev Bhakti',
                    bookingDate: booking.bookingDate || 'N/A',
                    packageName: booking.packageName,
                    packagePrice: booking.packagePrice,
                    platformFee: booking.platformFee,
                    totalAmount: booking.packagePrice + booking.platformFee,
                    status: 'BOOKED',
                    createdAt: booking.createdAt.toISOString(),
                    gothra: booking.gothra || undefined,
                    kuldevi: booking.kuldevi || undefined,
                    kuldevta: booking.kuldevta || undefined,
                    dob: booking.dob || undefined,
                    anniversary: booking.anniversary || undefined,
                    additionalDevotees: booking.additionalDevotees as any
                });
            } catch (emailError) {
                console.error('Failed to send offline booking email:', emailError);
            }
        }

        if (devoteePhone) {
            try {
                const phone = devoteePhone.startsWith('+') ? devoteePhone : `+91${devoteePhone}`;
                await sendWhatsAppMessage(phone, devoteeName, 'booking_confirmed', [devoteeName, getEnglish(booking.pooja.name)]);
            } catch (waError) {
                console.error('Failed to send offline booking WhatsApp:', waError);
            }
        }

        res.status(200).json({ success: true, data: booking, message: 'Offline Booking created successfully' });
    } catch (error: any) {
        console.error('Create offline booking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const lookupDevoteeByPhoneMandal = async (req: Request, res: Response) => {
    try {
        const phone = req.query.phone as string;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone is required' });
        }

        const cleaned = phone.replace(/\D/g, '');
        const normalized = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: normalized },
                    { phone: cleaned },
                    { phone }
                ],
                role: 'DEVOTEE'
            }
        });

        if (!user) {
            return res.json({ success: true, exists: false, data: null });
        }

        res.json({ success: true, exists: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMandalOfflinePoojaLeads = async (req: Request, res: Response) => {
    try {
        const mandalId = (req as any).owner?.ownerId;
        if (!mandalId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Mandal ID missing' });
        }

        const { search, page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(String(page), 10) || 1;
        const limitNum = parseInt(String(limit), 10) || 50;
        const skip = (pageNum - 1) * limitNum;

        const whereCondition: any = {
            mandalId: String(mandalId),
            OR: [
                { isOffline: true },
                { bookingSource: { in: ['MANDAL_OFFLINE', 'ADMIN_OFFLINE', 'COUNTER'] } }
            ]
        };

        if (search) {
            whereCondition.AND = [{
                OR: [
                    { devoteeName: { contains: String(search), mode: 'insensitive' } },
                    { devoteePhone: { contains: String(search), mode: 'insensitive' } },
                    { devoteeEmail: { contains: String(search), mode: 'insensitive' } },
                    { displayId: { contains: String(search), mode: 'insensitive' } }
                ]
            }];
        }

        const offlineBookings = await prisma.poojaBooking.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            include: {
                pooja: { select: { name: true } },
                user: { select: { id: true, displayId: true, isVerified: true } }
            }
        });

        const leadsMap = new Map<string, any>();
        offlineBookings.forEach((booking) => {
            const phone = booking.devoteePhone || 'UNKNOWN';
            if (!leadsMap.has(phone)) {
                leadsMap.set(phone, {
                    phone,
                    name: booking.devoteeName,
                    email: booking.devoteeEmail,
                    gothra: booking.gothra,
                    kuldevi: booking.kuldevi,
                    kuldevta: booking.kuldevta,
                    address: booking.address,
                    dob: booking.dob,
                    anniversary: booking.anniversary,
                    nativePlace: booking.nativePlace,
                    userId: booking.userId,
                    userDisplayId: booking.user?.displayId || null,
                    totalBookings: 0,
                    totalSpent: 0,
                    lastBookingDate: booking.createdAt,
                    bookings: []
                });
            }

            const lead = leadsMap.get(phone);
            lead.totalBookings += 1;
            lead.totalSpent += (booking.packagePrice || 0);
            lead.bookings.push({
                id: booking.id,
                displayId: booking.displayId,
                poojaName: booking.pooja?.name,
                packageName: booking.packageName,
                bookingDate: booking.bookingDate,
                packagePrice: booking.packagePrice,
                paymentMethod: booking.paymentMethod,
                transactionRef: booking.transactionRef,
                status: booking.status,
                createdAt: booking.createdAt
            });
        });

        const allLeads = Array.from(leadsMap.values());
        const paginatedLeads = allLeads.slice(skip, skip + limitNum);

        res.status(200).json({
            success: true,
            data: paginatedLeads,
            totalLeads: allLeads.length,
            totalBookingsCount: offlineBookings.length,
            totalRevenue: offlineBookings.reduce((sum, b) => sum + (b.packagePrice || 0), 0),
            page: pageNum,
            limit: limitNum
        });
    } catch (error: any) {
        console.error('Get mandal offline pooja leads error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
