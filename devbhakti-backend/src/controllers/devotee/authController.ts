import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

// Helper to normalize phone number to +91XXXXXXXXXX format
const normalizePhone = (phone: string): string => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 0 (11 digits), remove the 0
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If it has 10 digits, add 91
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }

    // Ensure it starts with +
    return '+' + cleaned;
};


export const sendOTP = async (req: Request, res: Response) => {
    try {
        let { phone, name, email, role } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        console.log(`[sendOTP] Original: ${phone}, Normalized: ${normalizedPhone}`);

        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const checkRole = role || 'DEVOTEE';
        let user = await prisma.user.findFirst({
            where: {
                phone: normalizedPhone,
                role: checkRole as any
            }
        });

        if (user) {
            // Update existing user with new OTP
            await prisma.user.update({
                where: { id: user.id },
                data: { otp, otpExpires }
            });
        } else {
            // Strict check for Institutions: They must register first
            if (checkRole === 'INSTITUTION') {
                return res.status(404).json({
                    success: false,
                    message: `No institution found with mobile number ${normalizedPhone}. Please register your temple first.`
                });
            }

            // Create new user (Devotee) if it's a devotee login flow
            user = await prisma.user.create({
                data: {
                    phone: normalizedPhone,
                    name: name || 'Devotee',
                    email: email || null,
                    role: 'DEVOTEE',
                    otp,
                    otpExpires,
                    isVerified: false
                }
            });
        }

        // In a real app, you would send OTP via SMS gateway here
        console.log(`OTP for ${normalizedPhone} as ${user.role}: ${otp}`);

        res.json({ success: true, message: 'OTP sent successfully', data: { phone: normalizedPhone, otp } });


    } catch (error) {
        console.error('Error in sendOTP:', error);
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

        // Check for Admin Approval if role is INSTITUTION
        if (user.role === 'INSTITUTION' && !user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. You will be able to login once approved.'
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
        const { name, email } = req.body;
        const profileImage = req.file ? `/uploads/users/${req.file.filename}` : undefined;

        const updatedUser = await prisma.user.update({
            where: { id: userId },

            data: {
                name,
                email,
                ...(profileImage && { profileImage })
            }
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
                    profileImage: updatedUser.profileImage
                }
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
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
