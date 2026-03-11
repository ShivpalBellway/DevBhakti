import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { notifyUser } from '../../services/firebaseService';
import ExcelJS from 'exceljs';
import { sendWhatsAppMessage } from '../../services/whatsappService';


export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { status, search, startDate, endDate, dateType, sortBy, sortOrder, bookingId } = req.query;

        let where: any = {};

        if (bookingId) {
            where.id = bookingId as string;
        }

        if (status && status !== 'all') {
            where.status = status;
        } else {
            // Default: Exclude PENDING bookings unless explicitly requested
            where.status = { not: 'PENDING' };
        }

        if (search) {
            where.OR = [
                { id: { contains: search as string, mode: 'insensitive' } },
                { devoteeName: { contains: search as string, mode: 'insensitive' } },
                { pooja: { name: { contains: search as string, mode: 'insensitive' } } },
                { temple: { name: { contains: search as string, mode: 'insensitive' } } }
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

        res.json({
            success: true,
            data: bookings,
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
        const { status } = req.body;

        if (!['PENDING', 'BOOKED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const updateData: any = { status };

        // Handle proof photos if status is COMPLETED
        if (status === 'COMPLETED' && req.files && Array.isArray(req.files) && req.files.length > 0) {
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
        } else if (status === "CANCELLED" || status === "REJECTED") {
            await prisma.templeLedger.updateMany({
                where: { sourceId: id as string, type: "POOJA_EARNING" },
                data: { status: "CANCELLED" }
            });
        }

        // Notify Devotee via Firebase
        await notifyUser(booking.userId, 'devotee', {
            title: `Pooja Booking ${status === 'COMPLETED' ? 'Completed 🎊' : status === 'CANCELLED' ? 'Cancelled ❌' : status === 'REJECTED' ? 'Rejected ❌' : 'Updated'}`,
            body: `Your booking for ${updatedBooking.pooja.name} has been marked as ${status.toLowerCase()}.`,
            data: { link: '/profile/bookings', bookingId: booking.id }
        });

        // Notify Devotee via WhatsApp
        try {
            const user = await prisma.user.findUnique({ where: { id: booking.userId } });
            if (user && user.phone) {
                const phone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;

                if (status === 'COMPLETED') {
                    await sendWhatsAppMessage(
                        phone,
                        user.name || 'Bhakt',
                        "pooja_completed",
                        [user.name || 'Bhakt', updatedBooking.pooja.name]
                    );
                } else if (status === 'CANCELLED' || status === 'REJECTED') {
                    await sendWhatsAppMessage(
                        phone,
                        user.name || 'Bhakt',
                        "booking_cancelled",
                        [user.name || 'Bhakt', updatedBooking.pooja.name]
                    );
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
        console.log("Generating Bookings Excel...");

        // 1. Data Fetch (Table name 'poojaBooking' use kiya hai aapke code ke hisaab se)
        const bookings = await prisma.poojaBooking.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                pooja: {
                    select: { name: true }
                }
            }
        });

        // 2. Workbook Setup
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Pooja Bookings Report');

        // 3. Columns define karein
        worksheet.columns = [
            { header: 'Booking ID', key: 'id', width: 30 },
            { header: 'Pooja Service', key: 'poojaName', width: 30 },
            { header: 'Package Name', key: 'packageName', width: 30 },
            { header: 'Devotee Name', key: 'devoteeName', width: 30 },
            { header: 'Phone', key: 'devoteePhone', width: 20 },
            { header: 'Email', key: 'devoteeEmail', width: 35 },
            { header: 'Price', key: 'packagePrice', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Booking Date', key: 'bookingDate', width: 20 },
            { header: 'Gothra', key: 'gothra', width: 20 },
            { header: 'Kuldevi', key: 'kuldevi', width: 20 },
            { header: 'Kuldevta', key: 'kuldevta', width: 20 },
            { header: 'DOB', key: 'dob', width: 15 },
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
            fgColor: { argb: 'FF794A05' }, // Theme Color
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // 5. Data Add karein
        bookings.forEach((b: any) => {
            worksheet.addRow({
                id: b.id,
                poojaName: b.pooja?.name || "N/A",
                packageName: b.packageName || "",
                devoteeName: b.devoteeName || "",
                devoteePhone: b.devoteePhone || "",
                devoteeEmail: b.devoteeEmail || "",
                packagePrice: b.packagePrice || 0,
                status: b.status,
                bookingDate: b.bookingDate || "",
                gothra: b.gothra || "",
                kuldevi: b.kuldevi || "",
                kuldevta: b.kuldevta || "",
                dob: b.dob || "",
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


