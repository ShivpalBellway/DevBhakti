import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import razorpay from "../../lib/razorpay";
import { generateDonationDisplayId } from "../../utils/idGenerator";
import { getLang, localize, getEnglish } from "../../utils/localization";
import { getCommissionForAmount } from "../admin/commissionSlabController";
import { CommissionCategory, SlabType } from "@prisma/client";
import PDFDocument from 'pdfkit';

import path from 'path';
import fs from 'fs';

export const initiateDonation = async (req: Request, res: Response) => {
    try {
        const {
            templeId,
            mandalId,
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

        if ((!templeId && !mandalId) || !amount || !donorName || !donorPhone || !donorEmail) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (amount > 10000000) {
            return res.status(400).json({ success: false, message: "Donation amount exceeds the maximum limit of ₹1 Crore" });
        }

        // Helper to check if a phone number belongs to India
        const isIndianUser = (phone: string): boolean => {
            if (!phone) return false;
            let hasExplicitPlus = phone.trim().startsWith('+');
            let cleaned = phone.replace(/\D/g, '');
            
            if (cleaned.startsWith('00')) {
                cleaned = cleaned.substring(2);
                hasExplicitPlus = true;
            }
            
            if (hasExplicitPlus) {
                return cleaned.startsWith('91') || cleaned.startsWith('9191');
            }
            
            if (cleaned.length === 11 && cleaned.startsWith('0')) return true;
            if (cleaned.length === 12 && cleaned.startsWith('91')) return true;
            if (cleaned.length === 10) return true;
            
            return false;
        };

        // --- FCRA Security Guard 1: Phone Number Country Check ---
        if (!isIndianUser(donorPhone)) {
            return res.status(400).json({
                success: false, 
                message: "Due to FCRA regulations, DevBhakti cannot accept donations from international numbers. Thank you for your understanding."
            });
        }

        // --- FCRA Security Guard 2: IP Geolocation Check ---
        const cfCountry = req.headers['cf-ipcountry'] as string;
        if (cfCountry && cfCountry.toUpperCase() !== 'IN' && cfCountry.toUpperCase() !== 'XX') {
            console.warn(`[FCRA Guard] Donation blocked due to foreign IP location header (${cfCountry}) for phone: ${donorPhone}`);
            return res.status(400).json({
                success: false,
                message: "Due to FCRA regulations, donations from foreign IP locations cannot be accepted. Thank you for your understanding."
            });
        }
        // --------------------------------------------------------

        let temple = null;
        let mandal = null;

        if (templeId) {
            temple = await prisma.temple.findUnique({
                where: { id: templeId },
                include: { user: { select: { isVerified: true } } }
            });
            if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });
            // Independent statuses: Verification and Temple status are separate
            const isTempleActive = temple.isActive;
            const isUserVerified = temple.user?.isVerified;
            
            // Logic:
            // - Verified + Active → Donations enabled
            // - Verified + Inactive → Donations disabled
            // - Unverified + Active → Donations disabled
            // - Unverified + Inactive → Donations disabled
            if (!isTempleActive || !isUserVerified) {
                return res.status(400).json({ success: false, message: "Donations are disabled for this temple." });
            }
        } else if (mandalId) {
            mandal = await prisma.mandal.findUnique({ where: { id: mandalId } });
            if (!mandal) return res.status(404).json({ success: false, message: "Mandal not found" });

            if (!mandal.isActive || mandal.status !== "APPROVED") {
                return res.status(400).json({ success: false, message: "Donations are disabled for this mandal." });
            }
        }

        const templeName = temple ? getEnglish(temple.name) : mandal ? getEnglish(mandal.name) : "Dev Bhakti";

        // Calculate Commission
        const commissionData = await getCommissionForAmount(
            amount,
            SlabType.GLOBAL,
            undefined,
            CommissionCategory.DONATION
        );

        const commissionAmount = commissionData.totalCommission || 0;
        const totalPayable = amount + commissionAmount;
        const netEarning = amount;

        // Create Razorpay Order
        const options = {
            amount: Math.round(totalPayable * 100), // amount in the smallest currency unit
            currency: "INR",
            receipt: `don_${Date.now()}`,
            notes: {
                templeId: templeId || null,
                templeName,
                donorName,
                type: "DONATION"
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Generate Custom Display ID
        const displayId = await generateDonationDisplayId();

        // Save Pending Donation Record
        const donation = await prisma.donation.create({
            data: {
                displayId,
                templeId: templeId || null,
                mandalId: mandalId || null,
                amount,
                commissionAmount,
                netEarning,
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
                temple: true,
                mandal: true
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
            
            const placeName = donation.temple ? getEnglish((donation.temple as any).name) : (donation.mandal ? getEnglish((donation.mandal as any).name) : "Dev Bhakti");
            const locationStr = donation.temple ? getEnglish((donation.temple as any).location) : (donation.mandal ? ((donation.mandal as any).city || "India") : "");
            
            doc.fillColor(textColor).font('Helvetica-Bold').fontSize(12).text(placeName);
            doc.font('Helvetica').fontSize(10).text(locationStr);
            doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold').text('STATUS: SUCCESSFUL', 350, doc.y + 10);

            doc.moveDown(4);

            // --- Donation Amount Box ---
            doc.fillColor(lightGray).rect(50, doc.y, 500, 80).fill();
            const contributionLabel = donation.mandal ? 'CONTRIBUTION TO MANDAL' : 'CONTRIBUTION TO TEMPLE';
            doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(contributionLabel, 60, doc.y + 15);
            doc.fontSize(20).text(`INR ${donation.amount.toLocaleString('en-IN')}`, 60, doc.y + 5);
            
            if (donation.commissionAmount && donation.commissionAmount > 0) {
                doc.fillColor(textColor).fontSize(9).font('Helvetica').text(`Platform Support Fee: INR ${donation.commissionAmount.toLocaleString('en-IN')}`, 60, doc.y + 10);
                doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text(`Total Amount Paid: INR ${(donation.amount + donation.commissionAmount).toLocaleString('en-IN')}`, 60, doc.y + 5);
            }

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
            const footerText = donation.mandal ? 'Your contribution helps support the mandal activities and community.' : 'Your contribution helps us preserve our sacred heritage and support the temple community.';
            doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique').text(footerText, { align: 'center' });
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

        const lang = getLang(req);
        res.json({
            success: true,
            data: localize(donations, lang)
        });
    } catch (error) {
        console.error('Error fetching my donations:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const calculateDonationCommission = async (req: Request, res: Response) => {
    try {
        const amount = parseFloat(req.query.amount as string);
        if (isNaN(amount) || amount <= 0) {
            return res.json({ success: true, platformFee: 0, totalPayable: 0 });
        }
        
        const commissionData = await getCommissionForAmount(
            amount,
            SlabType.GLOBAL,
            undefined,
            CommissionCategory.DONATION
        );
        
        res.json({ 
            success: true, 
            platformFee: commissionData.totalCommission || 0, 
            totalPayable: amount + (commissionData.totalCommission || 0)
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
