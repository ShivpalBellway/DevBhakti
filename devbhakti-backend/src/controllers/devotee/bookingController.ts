import { Request, Response } from 'express';

import { prisma } from '../../lib/prisma';

import PDFDocument from 'pdfkit';

import path from 'path';

import fs from 'fs';

import razorpay from '../../lib/razorpay';

import { getCommissionForAmount } from '../admin/commissionSlabController';

import { CommissionCategory, SlabType } from '@prisma/client';



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

            specialRequests,
            gothra,
            kuldevi,
            kuldevta,
            dob,
            anniversary,
            nativePlace,
            additionalDevotees

        } = req.body;



        if (!poojaId || !packageName || !packagePrice || !devoteeName || !devoteePhone) {

            return res.status(400).json({ success: false, message: 'All fields are required' });

        }



        // Get pooja and calculate commission using new slab system

        const pooja = await prisma.pooja.findUnique({

            where: { id: poojaId },

            include: {

                temple: true

            }

        });



        if (!pooja) {

            return res.status(404).json({ success: false, message: 'Pooja not found' });

        }



        // --- PRICE VERIFICATION ---

        // Ensure the price matches the database record to prevent spoofing

        let verifiedPrice = pooja.price;



        // If packages exist, find the one provided in req.body

        if (pooja.packages && Array.isArray(pooja.packages)) {

            const pkg = (pooja.packages as any[]).find(p => p.name === packageName);

            if (pkg) {

                verifiedPrice = parseFloat(pkg.price);

            } else {

                return res.status(400).json({ success: false, message: `Package '${packageName}' not found in this pooja` });

            }

        }



        // Optional: If price in body is significantly different, you might want to log it or use verifiedPrice

        const finalPrice = verifiedPrice || parseFloat(packagePrice);



        // Calculate commission via Slab System using verified price

        const commissionData = await getCommissionForAmount(

            finalPrice,

            SlabType.TEMPLE,

            pooja.templeId || undefined,

            CommissionCategory.POOJA

        );



        const commissionAmount = commissionData.totalCommission;

        // Since platform fee is added on top and charged to user, temple gets full price

        const netEarning = finalPrice;



        // --- AVAILABILITY CHECK ---




        // --- AVAILABILITY CHECK ---

        if (pooja.templeId) {
            // 1. Global Temple Availability
            const globalAvailability = await prisma.bookingAvailability.findFirst({
                where: {
                    templeId: pooja.templeId as string,
                    poojaId: undefined,
                    date: bookingDate as string
                }
            });

            if (globalAvailability) {
                if (globalAvailability.isClosed) {
                    return res.status(400).json({ success: false, message: 'Bookings are closed for this date.' });
                }
                const totalTempleBookings = await prisma.poojaBooking.count({
                    where: {
                        templeId: pooja.templeId as string,
                        bookingDate: bookingDate,
                        status: { not: 'CANCELLED' }
                    }
                });
                if (totalTempleBookings >= globalAvailability.maxBookings) {
                    return res.status(400).json({ success: false, message: 'Temple is fully booked for this date.' });
                }
            }

            // 2. Specific Pooja Availability
            const poojaAvailability = await prisma.bookingAvailability.findFirst({
                where: {
                    templeId: pooja.templeId as string,
                    poojaId: poojaId as string,
                    date: bookingDate as string
                }
            });

            if (poojaAvailability) {
                if (poojaAvailability.isClosed) {
                    return res.status(400).json({ success: false, message: 'This ritual is unavailable on this date.' });
                }
                const totalPoojaBookings = await prisma.poojaBooking.count({
                    where: {
                        poojaId: poojaId,
                        bookingDate: bookingDate,
                        status: { not: 'CANCELLED' }
                    }
                });
                if (totalPoojaBookings >= poojaAvailability.maxBookings) {
                    return res.status(400).json({ success: false, message: 'Daily limit reached for this ritual.' });
                }
            }
        }


        // (Existing availability check code stays here...)

        // ...rest of availability check...

        // --------------------------



        // Create booking and ledger entry in a transaction

        const booking = await prisma.$transaction(async (tx) => {

            const newBooking = await tx.poojaBooking.create({

                data: {

                    userId,

                    poojaId,
                    templeId: pooja.templeId || null,


                    packageName,

                    packagePrice: finalPrice, // Use verified price

                    devoteeName,

                    devoteePhone,

                    devoteeEmail: devoteeEmail as string | null,

                    bookingDate: bookingDate as string,

                    address: address as string | null,

                    specialRequests: specialRequests as string | null,
                    gothra: gothra as string | null,
                    kuldevi: kuldevi as string | null,
                    kuldevta: kuldevta as string | null,
                    dob: dob as string | null,
                    anniversary: anniversary as string | null,
                    nativePlace: nativePlace as string | null,
                    additionalDevotees: additionalDevotees || null,

                    status: 'PENDING', // Mark as pending until Razorpay payment is verified

                    commissionAmount,

                    netEarning

                }

            });



            // Create ledger entry for temple
            await tx.templeLedger.create({
                data: {
                    templeId: pooja.templeId || null,
                    amount: netEarning,
                    grossAmount: finalPrice, // Use verified price
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

            message: 'Pooja initiated. Complete payment to confirm.',

            data: booking,

            razorpayOrder: await razorpay.orders.create({

                amount: Math.round(packagePrice * 100),

                currency: "INR",

                receipt: `pooja_rcpt_${booking.id.slice(-10)}`,

            })

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



export const checkAvailability = async (req: Request, res: Response) => {

    try {

        const { templeId, poojaId, date } = req.query;



        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        if (!templeId) {
            return res.json({
                success: true,
                available: true,
                message: "Slot available"
            });
        }




        // 1. Global Availability Check

        const globalAvailability = await prisma.bookingAvailability.findFirst({

            where: {

                templeId: templeId as string,

                poojaId: undefined,

                date: date as string

            }

        });



        if (globalAvailability) {

            if (globalAvailability.isClosed) {

                return res.json({

                    success: true,

                    available: false,

                    message: "Bookings are stopped for this date. Please try the next available date."

                });

            }



            const totalTempleBookings = await prisma.poojaBooking.count({

                where: {

                    templeId: templeId as string,

                    bookingDate: date as string,

                    status: { not: 'CANCELLED' }

                }

            });



            if (totalTempleBookings >= globalAvailability.maxBookings) {

                return res.json({

                    success: true,

                    available: false,

                    message: "Daily booking limit reached. Please choose another date."

                });

            }

        }



        // 2. Specific Pooja Availability Check (if poojaId provided)

        if (poojaId) {

            const poojaAvailability = await prisma.bookingAvailability.findFirst({

                where: {

                    templeId: templeId as string,

                    poojaId: poojaId as string,

                    date: date as string

                }

            });



            if (poojaAvailability) {

                if (poojaAvailability.isClosed) {

                    return res.json({

                        success: true,

                        available: false,

                        message: "This ritual is unavailable on this date. Please try another day."

                    });

                }



                const totalPoojaBookings = await prisma.poojaBooking.count({

                    where: {

                        poojaId: poojaId as string,

                        bookingDate: date as string,

                        status: { not: 'CANCELLED' }

                    }

                });



                if (totalPoojaBookings >= poojaAvailability.maxBookings) {

                    return res.json({

                        success: true,

                        available: false,

                        message: "Slots full for this ritual on selected date. Please choose another date."

                    });

                }

            }

        }



        return res.json({

            success: true,

            available: true,

            message: "Slot available"

        });



    } catch (error) {

        console.error('Error checking availability:', error);

        res.status(500).json({ success: false, message: 'Internal server error' });

    }

};



export const getBookingReceipt = async (req: Request, res: Response) => {

    try {

        const id = req.params.id as string;

        const { userId } = (req as any).user;



        const booking = await prisma.poojaBooking.findFirst({

            where: { id, userId },

            include: {

                pooja: true,

                temple: true

            }

        });



        if (!booking) {

            return res.status(404).json({ success: false, message: 'Booking not found or access denied' });

        }



        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        const filename = `receipt-${booking.id.slice(-6)}.pdf`;



        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');

        res.setHeader('Content-type', 'application/pdf');



        doc.pipe(res);



        // --- Colors ---

        const primaryColor = '#88542B';

        const textColor = '#1e293b';

        const lightGray = '#f8fafc';

        const borderColor = '#e2e8f0';



        // --- Header Section ---

        const logoPath = path.join(__dirname, '../../../assets/logo.png');

        if (fs.existsSync(logoPath)) {

            doc.image(logoPath, 50, 45, { width: 60 });

            doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('DevBhakti', 120, 55);

            doc.fillColor(textColor).fontSize(10).font('Helvetica').text('Sacred Offerings & Temple Services', 120, 85);

        } else {

            doc.fillColor(primaryColor).fontSize(28).font('Helvetica-Bold').text('DevBhakti', { align: 'center' });

            doc.fillColor(textColor).fontSize(12).font('Helvetica').text('Sacred Offerings & Temple Services', { align: 'center' });

        }



        // Receipt Info (Top Right)

        doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('BOOKING RECEIPT', 400, 55, { align: 'right' });

        doc.font('Helvetica').fontSize(9).text(`No: #${booking.id.slice(0, 8).toUpperCase()}`, 400, 70, { align: 'right' });

        doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 400, 82, { align: 'right' });



        doc.moveDown(4);

        doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown(2);



        // --- Devotee & Booking Details ---

        const topOfDetails = doc.y;



        // Devotee Column

        doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('DEVOTEE DETAILS', 50, topOfDetails);

        doc.moveDown(0.5);

        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(12).text(booking.devoteeName);

        doc.font('Helvetica').fontSize(10).text(`Phone: ${booking.devoteePhone}`);

        if (booking.devoteeEmail) doc.text(`Email: ${booking.devoteeEmail}`);

        // Spiritual Details Below Devotee Initials
        doc.moveDown(1);
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('SPIRITUAL DETAILS', 50, doc.y);
        doc.fillColor(textColor).font('Helvetica').fontSize(9);
        if (booking.gothra) doc.text(`Gothra: ${booking.gothra}`);
        if (booking.kuldevi) doc.text(`Kuldevi: ${booking.kuldevi}`);
        if (booking.kuldevta) doc.text(`Kuldevta: ${booking.kuldevta}`);
        if (booking.dob) doc.text(`DOB: ${booking.dob}`);
        if (booking.nativePlace) doc.text(`Native Place: ${booking.nativePlace}`);


        // Booking Status Column (Right)

        doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('BOOKING STATUS', 350, topOfDetails);

        doc.moveDown(0.5);

        const status = (booking as any).status || 'BOOKED';

        doc.fillColor(status === 'BOOKED' ? '#059669' : '#d97706').fontSize(10).font('Helvetica-Bold').text(status, 350, doc.y);

        doc.fillColor(textColor).font('Helvetica').fontSize(10).text(`Payment Method: Online`, 350, doc.y + 2);



        doc.moveDown(4);



        // --- Ritual Table ---

        doc.fillColor(lightGray).rect(50, doc.y, 500, 25).fill();

        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('RITUAL DESCRIPTION', 60, doc.y + 7);

        doc.text('AMOUNT', 400, doc.y, { align: 'right', width: 140 });



        doc.moveDown(2);

        const tableY = doc.y;



        // Table Content

        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(11).text(`${(booking as any).pooja?.name || 'Pooja Service'}`, 60, tableY);

        doc.font('Helvetica').fontSize(9).text(`Temple: ${(booking as any).temple?.name || 'N/A'}`, 60, doc.y + 2);

        doc.text(`Package: ${booking.packageName}`, 60, doc.y + 2);

        doc.text(`Scheduled Date: ${new Date(booking.bookingDate as any).toLocaleDateString()}`, 60, doc.y + 2);



        doc.font('Helvetica-Bold').fontSize(11).text(`Rs. ${booking.packagePrice}`, 400, tableY, { align: 'right', width: 140 });



        doc.moveDown(5);

        doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown(1);



        // --- Summary Section ---

        const summaryY = doc.y;

        doc.fillColor(textColor).font('Helvetica').fontSize(10).text('Subtotal:', 350, summaryY);

        doc.font('Helvetica-Bold').text(`Rs. ${booking.packagePrice}`, 400, summaryY, { align: 'right', width: 140 });



        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(13).text('Total Amount Paid:', 280, doc.y);

        doc.fillColor(primaryColor).text(`Rs. ${booking.packagePrice}`, 400, doc.y - 13, { align: 'right', width: 140 });



        // --- Footer ---

        doc.moveDown(8);

        doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique').text('May the divine blessings bring peace, prosperity, and happiness to your life.', { align: 'center' });

        doc.moveDown(0.5);

        doc.text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center' });

        doc.moveDown(1.5);

        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('www.devbhakti.com', { align: 'center' });



        doc.end();



    } catch (error) {

        console.error('Error generating receipt:', error);

        res.status(500).json({ success: false, message: 'Internal server error' });

    }

};



export const getUnavailableDates = async (req: Request, res: Response) => {

    try {

        const { templeId, poojaId } = req.query;



        if (!templeId) {
            return res.json({ success: true, data: [] });
        }




        // 1. Fetch closed dates from BookingAvailability (Global or Specific)

        const closedRecords = await prisma.bookingAvailability.findMany({

            where: {

                templeId: templeId as string,

                isClosed: true,

                OR: [

                    { poojaId: null },

                    { poojaId: poojaId ? (poojaId as string) : undefined }

                ]

            },

            select: { date: true }

        });



        // 2. Fetch limit records (Global or Specific)

        const limitRecords = await prisma.bookingAvailability.findMany({

            where: {

                templeId: templeId as string,

                isClosed: false,

                OR: [

                    { poojaId: null },

                    { poojaId: poojaId ? (poojaId as string) : undefined }

                ]

            }

        });



        const unavailableFromLimits: string[] = [];



        for (const record of limitRecords) {

            const count = await prisma.poojaBooking.count({

                where: {

                    templeId: templeId as string,

                    poojaId: record.poojaId || undefined,

                    bookingDate: record.date,

                    status: { not: 'CANCELLED' }

                }

            });



            if (count >= record.maxBookings) {

                unavailableFromLimits.push(record.date);

            }

        }



        const unavailableDates = Array.from(new Set([

            ...closedRecords.map(r => r.date),

            ...unavailableFromLimits

        ]));



        return res.json({

            success: true,

            data: unavailableDates

        });



    } catch (error) {

        console.error('Error fetching unavailable dates:', error);

        res.status(500).json({ success: false, message: 'Internal server error' });

    }

};

