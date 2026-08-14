import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { localize, getLang, getEnglish } from '../../utils/localization';
import { getShiprocketTracking } from '../../services/shiprocketService';
import PDFDocument from 'pdfkit';

import path from 'path';

import fs from 'fs';

import razorpay from '../../lib/razorpay';

import { getCommissionForAmount } from '../admin/commissionSlabController';

import { CommissionCategory, SlabType } from '@prisma/client';
import { generateCustomId } from '../../utils/idGenerator';



export const createBooking = async (req: Request, res: Response) => {

    try {

        const { userId } = (req as any).user;

        const {
            poojaId,
            templeId: requestedTempleId,
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
            isPrasadRequested,
            prasadSelectionType,
            prasadQuantity
        } = req.body;

        if (!poojaId || !packageName || !packagePrice || !devoteeName || !devoteePhone) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }



        // Get pooja and calculate commission using new slab system
        const initialPooja = await prisma.pooja.findFirst({
            where: {
                OR: [
                    { id: poojaId },
                    { slug: poojaId }
                ]
            },
            include: {
                temple: true
            }
        });

        if (!initialPooja) {
            return res.status(404).json({ success: false, message: 'Pooja not found' });
        }



        // --- TEMPLE-SPECIFIC POOJA RESOLUTION ---
        // If a templeId was provided by the client and the found pooja doesn't belong
        // to that temple (e.g. it's a master pooja or a different temple's copy),
        // resolve to the correct temple-specific copy.
        let pooja = initialPooja;
        const effectiveTempleId = requestedTempleId || initialPooja.templeId || null;

        if (requestedTempleId && initialPooja.templeId !== requestedTempleId) {
            // Determine the master pooja ID to find the temple-specific copy
            const masterId = initialPooja.isMaster ? initialPooja.id : initialPooja.masterPoojaId;

            if (masterId) {
                const templeSpecificPooja = await prisma.pooja.findFirst({
                    where: {
                        templeId: requestedTempleId,
                        masterPoojaId: masterId,
                    },
                    include: { temple: true }
                });

                if (templeSpecificPooja) {
                    console.log(`[Booking] Resolved master/wrong pooja "${initialPooja.id}" → temple-specific pooja "${templeSpecificPooja.id}" for temple "${requestedTempleId}"`);
                    pooja = templeSpecificPooja;
                } else {
                    console.warn(`[Booking] No temple-specific copy found for master "${masterId}" at temple "${requestedTempleId}". Using original pooja.`);
                }
            }
        } else if (!requestedTempleId && initialPooja.isMaster) {
            // DevBhakti platform pooja booking - resolve to the platform-specific copy if one exists
            const platformSpecificPooja = await prisma.pooja.findFirst({
                where: {
                    templeId: null,
                    masterPoojaId: initialPooja.id,
                    isMaster: false
                },
                include: { temple: true }
            });
            if (platformSpecificPooja) {
                console.log(`[Booking] Resolved master pooja "${initialPooja.id}" → platform-specific pooja "${platformSpecificPooja.id}"`);
                pooja = platformSpecificPooja;
            }
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



        // Use server-verified price, never trust client-sent price

        const finalPrice = verifiedPrice;



        // --- PRASAD PRICE & VALIDATION ---
        let finalPrasadQuantity = 0;
        let finalPrasadAmount = 0;
        const templePrasadPrice = (pooja.temple as any)?.prasadPrice || 0;
        
        // Prasad can be requested if the Pooja has Free Prasad, or the Temple has Paid Prasad enabled.
        const canRequestPrasad = pooja.hasPrasad || templePrasadPrice > 0 || pooja.prasadType === 'PAID';
        let validPrasadRequested = canRequestPrasad && (isPrasadRequested === true || isPrasadRequested === 'true');

        // Only calculate Prasad Price if PAID Prasad was explicitly requested, and it's available
        if (validPrasadRequested && prasadSelectionType === 'PAID' && (pooja.prasadType === 'PAID' || templePrasadPrice > 0)) {
            finalPrasadQuantity = prasadQuantity ? parseInt(prasadQuantity, 10) : 1;
            
            // Backend Validation: Min 1, Max 10
            if (finalPrasadQuantity < 1) finalPrasadQuantity = 1;
            if (finalPrasadQuantity > 10) finalPrasadQuantity = 10;
            
            finalPrasadAmount = finalPrasadQuantity * templePrasadPrice;
        }

        // Calculate commission via Slab System using verified price
        const commissionData = await getCommissionForAmount(
            finalPrice,
            SlabType.TEMPLE,
            effectiveTempleId || undefined,
            CommissionCategory.POOJA
        );

        const commissionAmount = commissionData.totalCommission;

        // Since platform fee is added on top and charged to user, temple gets full price
        // Temple also gets the full prasad amount
        const netEarning = finalPrice + finalPrasadAmount;

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
                    poojaId: pooja.id,
                    date: bookingDate as string
                }
            });

            if (poojaAvailability) {
                if (poojaAvailability.isClosed) {
                    return res.status(400).json({ success: false, message: 'This ritual is unavailable on this date.' });
                }
                const totalPoojaBookings = await prisma.poojaBooking.count({
                    where: {
                        poojaId: pooja.id,
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
        const displayId = await generateCustomId('BKID');

        const booking = await prisma.$transaction(async (tx) => {

            const newBooking = await tx.poojaBooking.create({

                data: {
                    displayId,
                    userId,
                    poojaId: pooja.id,
                    templeId: effectiveTempleId,
                    mandalId: pooja.mandalId || null,

                    packageName,

                    packagePrice: finalPrice, // Use verified price

                    devoteeName,

                    devoteePhone,

                    devoteeEmail: devoteeEmail as string | null,

                    bookingDate: bookingDate as string,

                    address: address as string | null,
                    prasadStreet: prasadStreet as string | null,
                    prasadCity: prasadCity as string | null,
                    prasadState: prasadState as string | null,
                    prasadPincode: prasadPincode as string | null,

                    specialRequests: specialRequests as string | null,
                    gothra: gothra as string | null,
                    kuldevi: kuldevi as string | null,
                    kuldevta: kuldevta as string | null,
                    dob: dob as string | null,
                    gender: gender as string | null,
                    anniversary: anniversary as string | null,
                    nativePlace: nativePlace as string | null,
                    additionalDevotees: additionalDevotees || null,

                    // Prasad tracking
                    isPrasadRequested: validPrasadRequested,
                    prasadStatus: validPrasadRequested ? 'PREPARING' : 'NOT_APPLICABLE',
                    prasadQuantity: finalPrasadQuantity,
                    prasadAmount: finalPrasadAmount,

                    status: 'PENDING', // Mark as pending until Razorpay payment is verified
                    razorpayOrderId: null,

                    commissionAmount,
                    platformFee: commissionAmount,

                    netEarning

                }

            });

            // Create ledger entry for mandal or temple
            if (pooja.mandalId) {
                await tx.mandalLedger.create({
                    data: {
                        mandalId: pooja.mandalId,
                        amount: netEarning,
                        grossAmount: finalPrice + finalPrasadAmount,
                        commission: commissionAmount,
                        type: "POOJA_EARNING",
                        sourceId: newBooking.id,
                        description: `Pooja Booking: ${getEnglish((pooja as any).name)} (${packageName}) [${displayId}]${finalPrasadAmount > 0 ? ' + Prasad' : ''}`,
                        status: "PENDING"
                    }
                });
            } else if (effectiveTempleId) {
                await tx.templeLedger.create({
                    data: {
                        templeId: effectiveTempleId,
                        amount: netEarning,
                        grossAmount: finalPrice + finalPrasadAmount,
                        commission: commissionAmount,
                        type: "POOJA_EARNING",
                        sourceId: newBooking.id,
                        description: `Pooja Booking: ${getEnglish((pooja as any).name)} (${packageName}) [${displayId}]${finalPrasadAmount > 0 ? ' + Prasad' : ''}`,
                        status: "PENDING"
                    }
                });
            }




            return newBooking;

        });



        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round((finalPrice + commissionAmount + finalPrasadAmount) * 100),
            currency: "INR",
            receipt: `pooja_rcpt_${(booking.displayId || booking.id).slice(-10)}`,
            notes: {
                templeId: effectiveTempleId,
                templeName: getEnglish((pooja as any).temple?.name) || "Dev Bhakti",
                poojaName: getEnglish((pooja as any).name),
                devoteeName,
                displayId,
                type: "POOJA"
            }
        });

        await prisma.poojaBooking.update({
            where: { id: booking.id },
            data: { razorpayOrderId: razorpayOrder.id }
        });

        res.status(201).json({

            success: true,

            message: 'Pooja initiated. Complete payment to confirm.',

            data: booking,

            razorpayOrder

        });

    } catch (error) {

        console.error('Error creating booking:', error);

        res.status(500).json({ success: false, message: 'Internal server error' });

    }

};



export const getMyBookings = async (req: Request, res: Response) => {

    try {

        const { userId } = (req as any).user;

        // Fetch Pooja Bookings
        const poojaBookings = await prisma.poojaBooking.findMany({
            where: { 
                userId,
                status: { not: 'PENDING' }
            },
            include: {
                pooja: true,
                temple: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Fetch Photography Bookings
        const photoBookings = await prisma.photographyBooking.findMany({
            where: {
                userId,
                status: { not: 'PENDING' }
            },
            include: {
                temple: true,
                package: true,
                slot: true,
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Combine and format all bookings
        const allBookings = [
            ...poojaBookings.map(b => ({ ...b, type: 'POOJA' })),
            ...photoBookings.map(b => ({ 
                ...b, 
                type: 'PHOTOGRAPHY',
                devoteeName: b.user?.name || 'Devotee',
                devoteePhone: b.user?.phone || '',
                devoteeEmail: b.user?.email || '',
                pooja: {
                    name: `Photography (${getEnglish(b.package?.name) || 'Pass'})`,
                    image: b.temple?.image || ''
                },
                packageName: getEnglish(b.package?.name),
                packagePrice: b.packagePrice,
                platformFee: b.platformFee,
                totalAmount: b.totalAmount,
                bookingDate: b.bookingDate,
                timeSlot: b.slot?.slotName || b.timeSlot
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const lang = getLang(req);
        res.json({
            success: true,
            data: localize(allBookings, lang)
        });

    } catch (error) {

        console.error('Error fetching my bookings:', error);

        res.status(500).json({ success: false, message: 'Internal server error' });

    }

};



export const trackByAwb = async (req: Request, res: Response) => {
    try {
        const { awb } = req.query;

        if (!awb) {
            return res.status(400).json({ success: false, message: 'AWB code is required' });
        }

        const trackingResponse = await getShiprocketTracking(awb as string);

        return res.json({
            success: true,
            trackingData: trackingResponse
        });
    } catch (error: any) {
        console.error('Error tracking by AWB:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getPrasadTracking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = (req as any).user;

        const booking = await prisma.poojaBooking.findUnique({
            where: { id: id as string }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (!booking.isPrasadRequested) {
            return res.status(400).json({ success: false, message: 'Prasad not requested for this booking' });
        }

        if (!booking.awbCode) {
            return res.json({
                success: true,
                message: 'Shipment has not been dispatched yet.',
                trackingData: null
            });
        }

        console.log(`[Prasad Tracking] Fetching Shiprocket tracking details for AWB: ${booking.awbCode}...`);
        const trackingResponse = await getShiprocketTracking(booking.awbCode);

        res.json({
            success: true,
            trackingData: trackingResponse
        });
    } catch (error: any) {
        console.error('Error fetching prasad tracking:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



export const checkAvailability = async (req: Request, res: Response) => {

    try {

        const { templeId, poojaId, date } = req.query;



        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        let resolvedTempleId = templeId as string;
        let resolvedPoojaId = poojaId as string;

        // Resolve Temple ID if it's a slug
        if (templeId) {
            const temple = await prisma.temple.findFirst({
                where: {
                    OR: [
                        { id: templeId as string },
                        { slug: templeId as string }
                    ]
                },
                select: { id: true }
            });
            if (temple) resolvedTempleId = temple.id;
        }

        // Resolve Pooja ID if it's a slug
        if (poojaId) {
            const pooja = await prisma.pooja.findFirst({
                where: {
                    OR: [
                        { id: poojaId as string },
                        { slug: poojaId as string }
                    ]
                },
                select: { id: true }
            });
            if (pooja) resolvedPoojaId = pooja.id;
        }

        if (!resolvedTempleId) {
            return res.json({
                success: true,
                available: true,
                message: "Slot available"
            });
        }




        // 1. Global Availability Check

        const globalAvailability = await prisma.bookingAvailability.findFirst({

            where: {

                templeId: resolvedTempleId,

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

                    templeId: resolvedTempleId,

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

        if (resolvedPoojaId) {

            const poojaAvailability = await prisma.bookingAvailability.findFirst({

                where: {

                    templeId: resolvedTempleId,

                    poojaId: resolvedPoojaId,

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

                        poojaId: resolvedPoojaId,

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

        // Check if it's a pooja booking first
        let booking = await prisma.poojaBooking.findFirst({
            where: { id, userId },
            include: {
                pooja: true,
                temple: true
            }
        });

        let isPhotography = false;

        // If not a pooja booking, check if it's a photography booking
        if (!booking) {
            const photoBooking = await prisma.photographyBooking.findFirst({
                where: { id, userId },
                include: {
                    package: true,
                    temple: true,
                    user: true
                }
            });
            
            if (!photoBooking) {
                return res.status(404).json({ success: false, message: 'Booking not found or access denied' });
            }

            // Convert photography booking to compatible format
            booking = {
                ...photoBooking,
                pooja: null,
                devoteeName: photoBooking.user?.name || '',
                devoteePhone: photoBooking.user?.phone || '',
                devoteeEmail: photoBooking.user?.email || '',
                displayId: photoBooking.displayId,
                packageName: getEnglish(photoBooking.package.name),
                packagePrice: photoBooking.packagePrice,
                platformFee: photoBooking.platformFee,
                totalAmount: photoBooking.totalAmount,
                bookingDate: photoBooking.bookingDate
            } as any;
            isPhotography = true;
        }



        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `receipt-${booking!.displayId || booking!.id.slice(-6)}.pdf`;



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
        doc.font('Helvetica').fontSize(9).text(`No: #${booking!.displayId || booking!.id.slice(0, 8).toUpperCase()}`, 400, 70, { align: 'right' });

        doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 400, 82, { align: 'right' });



        doc.moveDown(4);

        doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown(2);



        // --- Devotee & Booking Details ---

        const topOfDetails = doc.y;



        // Devotee Column

        doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('DEVOTEE DETAILS', 50, topOfDetails);

        doc.moveDown(0.5);

        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(12).text(booking!.devoteeName);

        doc.font('Helvetica').fontSize(10).text(`Phone: ${booking!.devoteePhone}`);

        if (booking!.devoteeEmail) doc.text(`Email: ${booking!.devoteeEmail}`);



        // Spiritual Details Below Devotee Initials

        doc.moveDown(1);

        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('SPIRITUAL DETAILS', 50, doc.y);

        doc.fillColor(textColor).font('Helvetica').fontSize(9);

        if (booking!.gothra) doc.text(`Gothra: ${booking!.gothra}`);

        if (booking!.kuldevi) doc.text(`Kuldevi: ${booking!.kuldevi}`);

        if (booking!.kuldevta) doc.text(`Kuldevta: ${booking!.kuldevta}`);

        if (booking!.dob) doc.text(`DOB: ${booking!.dob}`);

        if (booking!.nativePlace) doc.text(`Native Place: ${booking!.nativePlace}`);



        const leftColumnBottom = doc.y;



        // Booking Status Column (Right)

        doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('BOOKING STATUS', 350, topOfDetails);

        doc.moveDown(0.5);

        const status = (booking as any).status || 'BOOKED';

        doc.fillColor(status === 'BOOKED' ? '#059669' : '#d97706').fontSize(10).font('Helvetica-Bold').text(status, 350, doc.y);

        doc.fillColor(textColor).font('Helvetica').fontSize(10).text(`Payment Method: Online`, 350, doc.y + 2);



        const rightColumnBottom = doc.y;



        // Start table after the longest column

        doc.y = Math.max(leftColumnBottom, rightColumnBottom) + 40;



        // --- Ritual Table ---

        doc.fillColor(lightGray).rect(50, doc.y, 500, 25).fill();

        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('RITUAL DESCRIPTION', 60, doc.y + 7);
        doc.text('AMOUNT', 400, doc.y, { align: 'right', width: 140 });



        doc.moveDown(2);

        const tableY = doc.y;



        // Table Content
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(11).text(`${getEnglish((booking as any).pooja?.name) || 'Pooja Service'}`, 60, tableY);

        doc.font('Helvetica').fontSize(9).text(`Temple: ${getEnglish((booking as any).temple?.name) || 'N/A'}`, 60, doc.y + 2);

        doc.text(`Package: ${booking!.packageName}`, 60, doc.y + 2);

        doc.text(`Scheduled Date: ${new Date(booking!.bookingDate as any).toLocaleDateString()}`, 60, doc.y + 2);



        doc.font('Helvetica-Bold').fontSize(11).text(`Rs. ${booking!.packagePrice}`, 400, tableY, { align: 'right', width: 140 });



        doc.moveDown(5);

        doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown(1);



        // --- Summary Section ---
        const summaryY = doc.y;
        doc.fillColor(textColor).font('Helvetica').fontSize(10).text('Subtotal:', 350, summaryY);
        doc.font('Helvetica-Bold').text(`Rs. ${booking!.packagePrice}`, 400, summaryY, { align: 'right', width: 140 });

        doc.moveDown(1);
        const feeY = doc.y;
        doc.fillColor(textColor).font('Helvetica').fontSize(10).text('Platform Fee:', 350, feeY);
        doc.font('Helvetica-Bold').text(`Rs. ${booking!.platformFee || 0}`, 400, feeY, { align: 'right', width: 140 });

        doc.moveDown(1.5);
        const totalY = doc.y;
        doc.font('Helvetica-Bold').fontSize(13).text('Total Amount Paid:', 280, totalY);
        doc.fillColor(primaryColor).text(`Rs. ${booking!.packagePrice + (booking!.platformFee || 0)}`, 400, totalY, { align: 'right', width: 140 });



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



        let resolvedTempleId = templeId as string;
        let resolvedPoojaId = poojaId as string;

        // Resolve IDs if they are slugs
        if (templeId) {
            const temple = await prisma.temple.findFirst({
                where: {
                    OR: [
                        { id: templeId as string },
                        { slug: templeId as string }
                    ]
                },
                select: { id: true }
            });
            if (temple) resolvedTempleId = temple.id;
        }

        if (poojaId) {
            const pooja = await prisma.pooja.findFirst({
                where: {
                    OR: [
                        { id: poojaId as string },
                        { slug: poojaId as string }
                    ]
                },
                select: { id: true }
            });
            if (pooja) resolvedPoojaId = pooja.id;
        }

        if (!resolvedTempleId) {
            return res.json({ success: true, data: [] });
        }




        // 1. Fetch closed dates from BookingAvailability (Global or Specific)

        const closedRecords = await prisma.bookingAvailability.findMany({

            where: {

                templeId: resolvedTempleId,

                isClosed: true,

                OR: [

                    { poojaId: null },

                    { poojaId: resolvedPoojaId || undefined }

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

                    templeId: resolvedTempleId,

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

