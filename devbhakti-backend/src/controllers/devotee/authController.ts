import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

import jwt from 'jsonwebtoken';
import { sendSMS } from '../../services/mobicommService';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

// Helper to normalize phone number to +91XXXXXXXXXX format
const normalizePhone = (phone: string): string => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 00 (double zero), replace with +
    if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
    }

    // If it starts with 0 (11 digits), remove the 0
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If it has 12 digits and starts with 91, it's already got the country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        // Keep it as is
    } else if (cleaned.length === 10) {
        // If it has 10 digits, add 91
        cleaned = '91' + cleaned;
    }

    // Final check for 9191 case (user entered 91 and app also added 91)
    if (cleaned.length === 14 && cleaned.startsWith('9191')) {
        cleaned = cleaned.substring(2);
    }

    // Ensure it starts with +
    return '+' + cleaned;
};

// Simple file logger for debugging when terminal output is unavailable
const logToFile = (message: string) => {
    const logPath = path.join(process.cwd(), 'debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
};


export const sendOTP = async (req: Request, res: Response) => {
    logToFile(`[sendOTP] Request body: ${JSON.stringify(req.body)}`);
    console.log('[sendOTP] Request body:', req.body);
    try {
        let { phone, name, email, role, mode } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        console.log(`[sendOTP] Original: ${phone}, Normalized: ${normalizedPhone}`);

        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const checkRole = role || 'DEVOTEE';

        // Infer mode if missing
        let effectiveMode = mode;
        if (!effectiveMode) {
            if (name) {
                effectiveMode = 'register';
            } else {
                // If no mode and no name, we'll check if user exists first
                const tempUser = await prisma.user.findFirst({
                    where: { phone: normalizedPhone }
                });
                effectiveMode = tempUser ? 'login' : 'register';
            }
            logToFile(`[sendOTP] Inferred mode: ${effectiveMode} (original mode was missing)`);
        }

        const isRegisterFlow = effectiveMode === 'register';

        // 1. Check if ANY user exists with this phone number
        let existingUser = await prisma.user.findFirst({
            where: { phone: normalizedPhone }
        });

        let user;

        if (existingUser) {
            // If phone exists, check if role matches
            if (existingUser.role !== (checkRole as any)) {
                return res.status(400).json({
                    success: false,
                    message: `This mobile number is already registered as a ${existingUser.role}. Please use a different number or login as ${existingUser.role}.`
                });
            }

            // If role matches but it's registration flow and user is already verified
            if (isRegisterFlow && existingUser.isVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'This mobile number is already registered and verified. Please login instead.'
                });
            }

            // If login flow and user doesn't exist/not verified (handled below)
            user = existingUser;
            await prisma.user.update({
                where: { id: user.id },
                data: { otp, otpExpires }
            });
        } else {
            // New user case
            if (!isRegisterFlow) {
                return res.status(404).json({
                    success: false,
                    message: `No account found with number ${normalizedPhone}. Please register to continue.`
                });
            }

            // Check if email is already taken before creating new user
            if (email) {
                const existingEmail = await prisma.user.findUnique({
                    where: { email: email.toLowerCase().trim() }
                });
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: `The email address ${email} is already registered. Please use a unique email or different mobile number.`
                    });
                }
            }

            // Create user
            user = await prisma.user.create({
                data: {
                    phone: normalizedPhone,
                    name: name || 'Devotee',
                    email: email ? email.toLowerCase().trim() : null,
                    role: checkRole as any,
                    otp,
                    otpExpires,
                    isVerified: false
                }
            });
        }

        // Send OTP via Mobicomm SMS
        const message = `Your OTP for DevBhakti login is ${otp}. Valid for 5 minutes. Do not share this code with anyone. `;
        const smsSent = await sendSMS(normalizedPhone, message);

        if (smsSent) {
            console.log(`[Auth] OTP sent successfully to ${normalizedPhone}`);
        } else {
            console.log(`[Auth] Failed to send OTP to ${normalizedPhone}. Check Mobicomm logs.`);
        }

        // console.log(`\n-----------------------------------------`);
        // console.log(`[DEVELOPMENT] OTP for ${normalizedPhone}: ${otp}`);
        // console.log(`-----------------------------------------\n`);

        // res.json({
        //     success: true,
        //     message: 'OTP sent successfully (Development Mode)',
        //     data: {
        //         phone: normalizedPhone,
        //         otp: otp // Crucial: send OTP to frontend for UI display
        //     }
        // });

        // Original response (keep for later restoration):
        res.json({ success: true, message: 'OTP sent successfully', data: { phone: normalizedPhone } });

    } catch (error: any) {
        console.error('Error in sendOTP:', error);

        // Final fallback for unique constraints (P2002)
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            if (target.includes('email')) {
                return res.status(400).json({ success: false, message: 'This email is already registered.' });
            }
            if (target.includes('phone')) {
                return res.status(400).json({ success: false, message: 'This mobile number is already registered.' });
            }
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        let { phone, otp, role } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        const normalizedPhone = normalizePhone(phone);
        const checkRole = role || 'DEVOTEE';

        console.log('--- OTP Verification Debug ---');
        console.log('Original Phone:', phone);
        console.log('Normalized Phone:', normalizedPhone);
        console.log('Role from request:', checkRole);
        console.log('OTP from request:', otp, typeof otp);

        const user = await prisma.user.findFirst({
            where: {
                phone: normalizedPhone,
                role: checkRole as any
            }
        });

        if (!user) {
            console.log('User not found in DB');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('User from DB:', {
            phone: user.phone,
            otp: user.otp,
            typeof_otp: typeof user.otp,
            otpExpires: user.otpExpires,
            now: new Date()
        });

        // Check if OTP matches and is not expired
        const isOtpMatch = String(user.otp) === String(otp);
        const hasExpiry = !!user.otpExpires;
        const isNotExpired = user.otpExpires ? user.otpExpires > new Date() : false;

        console.log('Comparison results:', { isOtpMatch, hasExpiry, isNotExpired });

        if (!isOtpMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (!hasExpiry || !isNotExpired) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        // Check for Admin Approval if role is INSTITUTION or SELLER
        if ((user.role === 'INSTITUTION' || user.role === 'SELLER') && !user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive or pending approval. Please contact admin.'
            });
        }

        // Mark DEVOTEE as verified (INSTITUTION is verified by Admin)
        const updateData: any = {
            otp: null,
            otpExpires: null
        };

        if (user.role === 'DEVOTEE') {
            updateData.isVerified = true;
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: updatedUser.id, phone: updatedUser.phone, role: updatedUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    profileImage: updatedUser.profileImage,
                    gothra: updatedUser.gothra,
                    kuldevi: updatedUser.kuldevi,
                    kuldevta: updatedUser.kuldevta,
                    dob: updatedUser.dob,
                    anniversary: updatedUser.anniversary,
                    isVerified: updatedUser.isVerified
                }
            }
        });

    } catch (error) {
        console.error('Error in verifyOTP:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user; // From auth middleware
        const { name, email, gothra, kuldevi, kuldevta, dob, anniversary, address } = req.body;
        const profileImage = req.file ? `/uploads/users/${req.file.filename}` : undefined;

        // If email is being updated, check if it's already taken by another user
        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() }
            });

            // If email exists and belongs to a different user
            if (existingEmail && existingEmail.id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: `The email address ${email} is already registered. Please use a unique email address.`
                });
            }
        }

        const updateData: any = {
            name,
            gothra,
            kuldevi,
            kuldevta,
            dob,
            anniversary,
            address
        };

        // Only update email if provided
        if (email) {
            updateData.email = email.toLowerCase().trim();
        }

        // Add profile image if uploaded
        if (profileImage) {
            updateData.profileImage = profileImage;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    profileImage: updatedUser.profileImage,
                    gothra: updatedUser.gothra,
                    kuldevi: updatedUser.kuldevi,
                    kuldevta: updatedUser.kuldevta,
                    dob: updatedUser.dob,
                    anniversary: updatedUser.anniversary,
                    address: updatedUser.address
                }
            }
        });

    } catch (error: any) {
        console.error('Error updating profile:', error);

        // Handle unique constraint violations
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            if (target.includes('email')) {
                return res.status(400).json({
                    success: false,
                    message: 'This email address is already registered to another account.'
                });
            }
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                role: true,
                profileImage: true,
                gothra: true,
                kuldevi: true,
                kuldevta: true,
                dob: true,
                anniversary: true,
                address: true,
                isVerified: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: { user } });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
