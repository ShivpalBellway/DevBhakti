import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';


export const sendOTP = async (req: Request, res: Response) => {
    try {
        const { phone, name, email } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }


        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let user = await prisma.user.findUnique({ where: { phone } });

        if (user) {
            // Update existing user with new OTP
            await prisma.user.update({
                where: { phone },
                data: { otp, otpExpires }
            });
        } else {
            // Create new user (Devotee)
            // If name is not provided during login, we might need it for registration case
            user = await prisma.user.create({
                data: {
                    phone,
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
        console.log(`OTP for ${phone}: ${otp}`);

        res.json({ success: true, message: 'OTP sent successfully', data: { phone, otp } });


    } catch (error) {
        console.error('Error in sendOTP:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

};

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }


        const user = await prisma.user.findUnique({ where: { phone } });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }


        // Check if OTP matches and is not expired
        if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }


        // Mark user as verified and clear OTP
        const updatedUser = await prisma.user.update({
            where: { phone },
            data: {
                isVerified: true,
                otp: null,
                otpExpires: null
            }
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
                    profileImage: updatedUser.profileImage
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
