import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import razorpay from "../../lib/razorpay";
import { generateDonationDisplayId } from "../../utils/idGenerator";
import PDFDocument from 'pdfkit';

import path from 'path';
import fs from 'fs';

export const initiateDonation = async (req: Request, res: Response) => {
    try {
        const {
            templeId,
            amount,
            donorName,
            donorPhone,
            donorEmail,
            isAnonymous,
            is80GRequired,
            panNumber,
            address,
            message,
            userId
        } = req.body;

        if (!templeId || !amount || !donorName || !donorPhone || !donorEmail) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const temple = await prisma.temple.findUnique({ where: { id: templeId } });
        if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });

        // Create Razorpay Order
        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit
            currency: "INR",
            receipt: `don_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Generate Custom Display ID
        const displayId = generateDonationDisplayId();

        // Save Pending Donation Record
        const donation = await prisma.donation.create({
            data: {
                displayId,
                templeId,

                amount,
                donorName,
                donorPhone,
                donorEmail,
                isAnonymous: !!isAnonymous,
                is80GRequired: !!is80GRequired,
                panNumber,
                address,
                message,
                userId: userId || null,
                status: "PENDING",
                razorpayOrderId: razorpayOrder.id,
            }
        });

        res.status(200).json({
            success: true,
            order: razorpayOrder,
            donationId: donation.id
        });
    } catch (error: any) {
        console.error("Initiate Donation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateDonationReceiptBuffer = async (donationId: string): Promise<{ buffer: Buffer, filename: string } | null> => {
    try {
        const donation = await prisma.donation.findFirst({
            where: { id: donationId, status: 'SUCCESS' },
            include: {
                temple: true
            }
        });

        if (!donation) return null;

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const filename = `donation-receipt-${donation.id.slice(-6)}.pdf`;
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), filename }));
            doc.on('error', (err) => reject(err));

            // --- Colors ---
            const primaryColor = '#7c4624';
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
            doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('DONATION RECEIPT', 400, 55, { align: 'right' });
            doc.font('Helvetica').fontSize(9).text(`No: #${donation.displayId || donation.id.slice(0, 8).toUpperCase()}`, 400, 70, { align: 'right' });

            doc.text(`Date: ${new Date(donation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 400, 82, { align: 'right' });

            doc.moveDown(4);
            doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(2);

            // --- Donor & Temple Details ---
            const topOfDetails = doc.y;

            // Donor Column
            doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('DONOR DETAILS', 50, topOfDetails);
            doc.moveDown(0.5);
            doc.fillColor(textColor).font('Helvetica-Bold').fontSize(12).text(donation.isAnonymous ? 'Anonymous Devotee' : donation.donorName);
            if (!donation.isAnonymous) {
                doc.font('Helvetica').fontSize(10).text(`Phone: ${donation.donorPhone}`);
                doc.text(`Email: ${donation.donorEmail}`);
            }
            if (donation.panNumber) doc.text(`PAN: ${donation.panNumber}`);
            if (donation.address) doc.text(`Address: ${donation.address}`);

            // Temple Column (Right)
            doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('DONATED TO', 350, topOfDetails);
            doc.moveDown(0.5);
            doc.fillColor(textColor).font('Helvetica-Bold').fontSize(12).text(donation.temple.name);
            doc.font('Helvetica').fontSize(10).text(donation.temple.location);
            doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold').text('STATUS: SUCCESSFUL', 350, doc.y + 10);

            doc.moveDown(4);

            // --- Donation Amount Box ---
            doc.fillColor(lightGray).rect(50, doc.y, 500, 60).fill();
            doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('CONTRIBUTION AMOUNT', 60, doc.y + 15);
            doc.fontSize(20).text(`INR ${donation.amount.toLocaleString('en-IN')}`, 60, doc.y + 5);

            doc.moveDown(4);
            doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(2);

            // Sankalp / Message
            if (donation.message) {
                doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('SANKALP / MESSAGE', 50, doc.y);
                doc.fillColor(textColor).font('Helvetica').fontSize(10).text(`"${donation.message}"`, 50, doc.y + 5);
                doc.moveDown(2);
            }

            // 80G Info if applicable
            if (donation.is80GRequired) {
                doc.fillColor(textColor).fontSize(10).font('Helvetica-Oblique').text('* This donation is eligible for tax benefit under section 80G.', 50, doc.y);
                doc.moveDown(2);
            }

            // --- Footer ---
            doc.moveDown(8);
            doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique').text('Your contribution helps us preserve our sacred heritage and support the temple community.', { align: 'center' });
            doc.moveDown(0.5);
            doc.text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center' });
            doc.moveDown(1.5);
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('www.devbhakti.com', { align: 'center' });

            doc.end();
        });

    } catch (error) {
        console.error('Error generating donation receipt:', error);
        return null;
    }
};

export const getDonationReceipt = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const receiptData = await generateDonationReceiptBuffer(id);

        if (!receiptData) {
            return res.status(404).json({ success: false, message: 'Donation not found or access denied' });
        }

        res.setHeader('Content-disposition', 'attachment; filename="' + receiptData.filename + '"');
        res.setHeader('Content-type', 'application/pdf');
        res.send(receiptData.buffer);

    } catch (error) {
        console.error('Error generating donation receipt:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getMyDonations = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;

        const donations = await prisma.donation.findMany({
            where: {
                userId,
                status: { in: ['SUCCESS', 'FAILED'] }
            },
            include: {
                temple: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: donations
        });
    } catch (error) {
        console.error('Error fetching my donations:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
