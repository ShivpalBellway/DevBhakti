import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notifyUser } from '../../services/firebaseService';
import ExcelJS from 'exceljs';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { getLang, localize, getEnglish } from '../../utils/localization';
import { triggerPrasadShiprocketOrder } from '../../utils/prasadShiprocket';
import { generateBookingDisplayId } from '../../utils/idGenerator';
import { sendBookingReceiptEmail } from '../../services/bookingMailService';

export const createOfflineBooking = async (req: Request, res: Response) => {
    try {
        const {
            poojaId,
            templeId,
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

        // Enforce Temple ID if the user is a Temple Admin (Staff)
        let finalTempleId = templeId;
        const user = (req as any).user;
        if (user && user.ownerType === 'TEMPLE' && user.ownerId) {
            finalTempleId = user.ownerId;
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
                templeId: finalTempleId,
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
            if (finalTempleId) {
                // Map BookingStatus to valid LedgerStatus
                const ledgerStatus = status === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
                await prisma.templeLedger.create({
                    data: {
                        templeId: finalTempleId,
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

        // Notify Temple Admin via WhatsApp
        if (booking.temple?.phone) {
            try {
                const templePhone = booking.temple.phone.startsWith('+') ? booking.temple.phone : `+91${booking.temple.phone}`;
                await sendWhatsAppMessage(
                    templePhone,
                    "Temple Admin",
                    "temple_admin_new_booking_received",
                    [
                        getEnglish(booking.temple.name),
                        booking.displayId,
                        getEnglish(booking.pooja.name),
                        new Date().toLocaleDateString('en-IN')
                    ]
                );
            } catch (templeWaError) {
                console.error("Failed to notify offline booking temple admin WhatsApp:", templeWaError);
            }
        }

        res.status(200).json({ success: true, data: booking, message: "Offline Booking created successfully" });
    } catch (error: any) {
        console.error("Create Offline Booking Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { status, search, startDate, endDate, dateType, sortBy, sortOrder, bookingId, templeId } = req.query;

        let where: any = {};

        if (bookingId) {
            where.id = bookingId as string;
        }

        if (templeId && templeId !== 'all') {
            where.templeId = templeId as string;
        }

        if (status && status !== 'all') {
            where.status = status;
        } else {
            // Default: Exclude PENDING bookings unless explicitly requested
            where.status = { not: 'PENDING' };
        }

        if (search) {
            where.OR = [
                { devoteeName: { contains: search as string, mode: 'insensitive' } },
                { devoteePhone: { contains: search as string, mode: 'insensitive' } },
                { id: { contains: search as string, mode: 'insensitive' } },
                { displayId: { contains: search as string, mode: 'insensitive' } },
                { 
                    temple: {
                        OR: [
                            { name: { path: ['en'], string_contains: search as string } },
                            { name: { path: ['hi'], string_contains: search as string } },
                            { name: { path: ['mr'], string_contains: search as string } },
                            { location: { path: ['en'], string_contains: search as string } }
                        ]
                    }
                }
            ];
        }

     
        if (startDate || endDate) {
            if (dateType === 'ritualDate') {
                where.bookingDate = {};
                if (startDate) {
                    // bookingDate is string like 'YYYY-MM-DD'
                    const s = new Date(String(startDate)).toISOString().split('T')[0];
                    where.bookingDate.gte = s;
                }
                if (endDate) {
                    const e = new Date(String(endDate)).toISOString().split('T')[0];
                    where.bookingDate.lte = e;
                }
            } else {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(String(startDate));
                if (endDate) where.createdAt.lte = new Date(String(endDate));
            }
        }

        let orderByProp: any = { createdAt: 'desc' };
        if (sortBy === 'ritualDate') {
            orderByProp = { bookingDate: sortOrder === 'asc' ? 'asc' : 'desc' };
        } else if (sortBy === 'bookingDate') {
            orderByProp = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
        }

        const [bookings, total, bookedCount, completedCount, cancelledCount, rejectedCount] = await Promise.all([
            prisma.poojaBooking.findMany({
                where,
                include: {
                    pooja: true,
                    temple: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            email: true
                        }
                    }
                },
                orderBy: orderByProp,
                skip,
                take: limit,
            }),
            prisma.poojaBooking.count({ where }),
            prisma.poojaBooking.count({ where: { ...where, status: 'BOOKED' } }),
            prisma.poojaBooking.count({ where: { ...where, status: 'COMPLETED' } }),
            prisma.poojaBooking.count({ where: { ...where, status: 'CANCELLED' } }),
            prisma.poojaBooking.count({ where: { ...where, status: 'REJECTED' } }),
        ]);

        const lang = getLang(req);
        const localizedBookings = localize(bookings, lang);

        // Add explicit paymentStatus and deliveryStatus for "proper" API response
        const enhancedBookings = localizedBookings.map((b: any) => ({
            ...b,
            paymentStatus: 'Success',
            deliveryStatus: b.status
        }));

        res.json({
            success: true,
            data: enhancedBookings,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            stats: {
                booked: bookedCount,
                completed: completedCount,
                cancelled: cancelledCount,
                rejected: rejectedCount
            }
        });
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteBookingByAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.poojaBooking.delete({
            where: { id: id as string }
        });

        res.json({
            success: true,
            message: 'Booking deleted successfully by admin'
        });
    } catch (error) {
        console.error('Error deleting booking by admin:', error);
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

        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (prasadStatus) updateData.prasadStatus = prasadStatus;
        if (awbCode !== undefined) updateData.awbCode = awbCode;
        if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
        if (courierName !== undefined) updateData.courierName = courierName;

        // Handle proof photos if status is COMPLETED
        if (status === 'COMPLETED' && req.files && Array.isArray(req.files) && req.files.length > 0) {
            const photoUrls = (req.files as Express.Multer.File[]).map(
                (file) => `/uploads/proofs/${file.filename}`
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
                    console.error("Failed to trigger Prasad Shiprocket Order asynchronously (Admin):", err);
                });
            }
        } else if (status === "CANCELLED" || status === "REJECTED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: id as string, type: "POOJA_EARNING" },
                data: { status: "CANCELLED" }
            });
        }

        const poojaName = getEnglish((updatedBooking.pooja as any).name);

        // Notify Devotee via Firebase
        const userId = booking.userId ?? undefined;
        if (status && userId) {
            await notifyUser(userId, 'devotee', {
                title: `Pooja Booking ${status === 'COMPLETED' ? 'Completed 🎊' : status === 'CANCELLED' ? 'Cancelled ❌' : status === 'REJECTED' ? 'Rejected ❌' : 'Updated'}`,
                body: `Your booking for ${poojaName} has been marked as ${status.toLowerCase()}.`,
                data: { link: '/profile/bookings', bookingId: booking.id }
            });
        }

        // Notify Devotee via WhatsApp
        try {
            if (userId) {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user && user.phone) {
                    const phone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;

                    if (status === 'COMPLETED') {
                        await sendWhatsAppMessage(
                            phone,
                            user.name || 'Bhakt',
                            "pooja_completed",
                            [user.name || 'Bhakt', poojaName]
                        );
                    } else if (status === 'CANCELLED' || status === 'REJECTED') {
                        await sendWhatsAppMessage(
                            phone,
                            user.name || 'Bhakt',
                            "booking_cancelled",
                            [user.name || 'Bhakt', poojaName]
                        );
                    }
                }
            }
        } catch (waError) {
            console.error("Failed to send status update WhatsApp:", waError);
        }

        res.json({
            success: true,
            message: `Booking status updated to ${status} by admin`,
            data: updatedBooking
        });
    } catch (error) {
        console.error('Error updating booking status by admin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const downloadBookingsExcel = async (req: Request, res: Response) => {
    try {
        console.log("Generating Filtered Bookings Excel...");

        const { status, search, startDate, endDate, dateType, sortBy, sortOrder, bookingId, templeId } = req.query;

        let where: any = {};

        if (bookingId) {
            where.id = bookingId as string;
        }

        if (templeId && templeId !== 'all') {
            where.templeId = templeId as string;
        }

        if (status && status !== 'all') {
            where.status = status;
        } else {
            where.status = { not: 'PENDING' };
        }

        if (search) {
            where.OR = [
                { devoteeName: { contains: search as string, mode: 'insensitive' } },
                { devoteePhone: { contains: search as string, mode: 'insensitive' } },
                { id: { contains: search as string, mode: 'insensitive' } },
                { displayId: { contains: search as string, mode: 'insensitive' } },
                { 
                    temple: {
                        OR: [
                            { name: { path: ['en'], string_contains: search as string } },
                            { name: { path: ['hi'], string_contains: search as string } },
                            { name: { path: ['mr'], string_contains: search as string } },
                            { location: { path: ['en'], string_contains: search as string } }
                        ]
                    }
                }
            ];
        }

        if (startDate || endDate) {
            if (dateType === 'ritualDate') {
                where.bookingDate = {};
                if (startDate) {
                    const s = new Date(String(startDate)).toISOString().split('T')[0];
                    where.bookingDate.gte = s;
                }
                if (endDate) {
                    const e = new Date(String(endDate)).toISOString().split('T')[0];
                    where.bookingDate.lte = e;
                }
            } else {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(String(startDate));
                if (endDate) where.createdAt.lte = new Date(String(endDate));
            }
        }

        let orderByProp: any = { createdAt: 'desc' };
        if (sortBy === 'ritualDate') {
            orderByProp = { bookingDate: sortOrder === 'asc' ? 'asc' : 'desc' };
        } else if (sortBy === 'bookingDate') {
            orderByProp = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
        }

        const bookings = await prisma.poojaBooking.findMany({
            where,
            orderBy: orderByProp,
            include: {
                pooja: {
                    select: { name: true }
                },
                temple: {
                    select: { name: true, location: true }
                }
            }
        });

        // 2. Workbook Setup
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Pooja Bookings Report');

        // 3. Columns defined (Internal ID removed as requested)
        worksheet.columns = [
            { header: 'Booking ID', key: 'displayId', width: 20 },
            { header: 'Pooja Service', key: 'poojaName', width: 30 },
            { header: 'Temple Name', key: 'templeName', width: 30 },
            { header: 'Temple Location', key: 'templeLocation', width: 30 },
            { header: 'Package Name', key: 'packageName', width: 30 },
            { header: 'Devotee Name', key: 'devoteeName', width: 30 },
            { header: 'Phone', key: 'devoteePhone', width: 20 },
            { header: 'Email', key: 'devoteeEmail', width: 35 },
            { header: 'Package Price', key: 'packagePrice', width: 15 },
            { header: 'Platform Fee', key: 'platformFee', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
            { header: 'Delivery Status', key: 'deliveryStatus', width: 15 },
            { header: 'Ritual Date', key: 'bookingDate', width: 20 },
            { header: 'Gothra', key: 'gothra', width: 20 },
            { header: 'Kuldevi', key: 'kuldevi', width: 20 },
            { header: 'Kuldevta', key: 'kuldevta', width: 20 },
            { header: 'DOB', key: 'dob', width: 15 },
            { header: 'Anniversary', key: 'anniversary', width: 15 },
            { header: 'Native Place', key: 'nativePlace', width: 25 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'Special Requests', key: 'specialRequests', width: 40 },
            { header: 'Additional Devotees', key: 'additionalDevotees', width: 50 },
            { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        // 4. Header Styling
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF794A05' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // 5. Data Add karein
        bookings.forEach((b: any) => {
            worksheet.addRow({
                displayId: b.displayId || 'N/A',
                poojaName: getEnglish(b.pooja?.name) || "N/A",
                templeName: getEnglish(b.temple?.name) || "N/A",
                templeLocation: getEnglish(b.temple?.location) || "N/A",
                packageName: b.packageName || "",
                devoteeName: b.devoteeName || "",
                devoteePhone: b.devoteePhone || "",
                devoteeEmail: b.devoteeEmail || "",
                packagePrice: b.packagePrice || 0,
                platformFee: b.platformFee || 0,
                totalAmount: (b.packagePrice || 0) + (b.platformFee || 0),
                paymentStatus: 'Success',
                deliveryStatus: b.status,
                bookingDate: b.bookingDate || "",
                gothra: b.gothra || "",
                kuldevi: b.kuldevi || "",
                kuldevta: b.kuldevta || "",
                dob: b.dob || "",
                anniversary: b.anniversary || "",
                nativePlace: b.nativePlace || "",
                address: b.address || "",
                specialRequests: b.specialRequests || "",
                additionalDevotees: b.additionalDevotees ? JSON.stringify(b.additionalDevotees) : "",
                createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "",
            });
        });

        // 6. Auto-Width
        worksheet.columns?.forEach((column) => {
            let maxLength = 0;
            column?.eachCell?.({ includeEmpty: true }, (cell) => {
                const cellLength = cell.value ? cell.value.toString().length : 0;
                if (cellLength > maxLength) maxLength = cellLength;
            });
            if (column) column.width = maxLength < 10 ? 12 : maxLength + 4;
        });

        // 7. Buffer Generate
        const buffer = await workbook.xlsx.writeBuffer();

        // 8. Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=pooja_bookings_${new Date().toISOString().slice(0, 10)}.xlsx`);

        return res.status(200).send(buffer);

    } catch (error: any) {
        console.error("Bookings Export Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
