import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

import jwt from 'jsonwebtoken';
import { sendSMS } from '../../services/mobicommService';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { generateCustomId } from '../../utils/idGenerator';
import { getLang, localize } from '../../utils/localization';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

// Helper to normalize phone number to +91XXXXXXXXXX format
const normalizePhone = (phone: string): string => {
    // Check if user explicitly provided a country code with '+'
    const hasExplicitPlus = phone.trim().startsWith('+');
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 00 (double zero), replace with +
    if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
        return '+' + cleaned;
    }

    if (hasExplicitPlus) {
        return '+' + cleaned;
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

const prismaAny = prisma as any;





export const checkPhoneExistence = async (req: Request, res: Response) => {
    try {
        const { phone, role } = req.query || req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone as string);
        const user = await prisma.user.findFirst({
            where: { 
                phone: normalizedPhone,
                ...(role ? { role: role as any } : {})
            }
        });

        return res.json({
            success: true,
            exists: !!user,
            isNewUser: !user  // true = new user, false = existing
        });
    } catch (error: any) {
        console.error('Error in checkPhoneExistence:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const checkPhoneOnly = async (req: Request, res: Response) => {
    try {
        const { phone, role } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        const user = await prisma.user.findFirst({
            where: { 
                phone: normalizedPhone,
                ...(role ? { role: role as any } : {})
            }
        });

        return res.json({
            success: true,
            exists: !!user,
            isNewUser: !user  // true = new user, false = existing
        });
    } catch (error: any) {
        console.error('Error in checkPhoneOnly:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getPhoneVariants = (normalizedPhone: string) => {
    const digits = normalizedPhone.replace(/\D/g, '');
    const normalized = normalizedPhone.startsWith('+') ? normalizedPhone : `+${digits}`;
    const variants = new Set<string>([normalized, digits]);

    if (digits.startsWith('91') && digits.length === 12) {
        const withoutCountry = digits.substring(2);
        variants.add(withoutCountry);
        variants.add('0' + withoutCountry);
        variants.add('91' + withoutCountry);
        variants.add('+91' + withoutCountry);
    } else if (digits.length === 10) {
        variants.add('91' + digits);
        variants.add('+91' + digits);
        variants.add('0' + digits);
    }

    return Array.from(variants);
};

const createOtpVerification = async (data: {
    phone: string;
    role: string;
    otp: string;
    otpExpires: Date;
    isRegisterFlow: boolean;
    name?: string;
    email?: string;
}) => {
    // @ts-ignore: otpVerification model may not be present in generated Prisma client yet
    await prismaAny['otpVerification'].updateMany({
        where: {
            phone: data.phone,
            role: data.role as any,
            isUsed: false
        },
        data: { isUsed: true }
    });

    // @ts-ignore: otpVerification model may not be present in generated Prisma client yet
    return prismaAny['otpVerification'].create({
        data: {
            phone: data.phone,
            role: data.role as any,
            otp: data.otp,
            otpExpires: data.otpExpires,
            isRegisterFlow: data.isRegisterFlow,
            name: data.name,
            email: data.email
        }
    });
};

const linkDonationsToUser = async (userId: string, phone: string, email?: string | null) => {
    const variants = getPhoneVariants(phone);
    const orConditions: any[] = [
        { donorPhone: { in: variants } }
    ];
    if (email) {
        orConditions.push({ donorEmail: email.toLowerCase().trim() });
    }

    await prisma.donation.updateMany({
        where: {
            userId: null,
            OR: orConditions
        },
        data: { userId }
    });
};

export const checkSellerPhone = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        const user = await prisma.user.findFirst({
            where: { 
                phone: normalizedPhone,
                role: 'SELLER'
            }
        });

        if (!user) {
            // Phone does not exist in DB at all
            return res.json({
                success: true,
                isSellerRegistered: false,
                reason: 'not_found'
            });
        }

        if (user.role !== 'SELLER') {
            // Phone exists but is not a SELLER
            return res.json({
                success: true,
                isSellerRegistered: false,
                reason: 'wrong_role'
            });
        }

        // Phone exists and IS a SELLER
        return res.json({
            success: true,
            isSellerRegistered: true
        });
    } catch (error: any) {
        console.error('Error in checkSellerPhone:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const checkEmailExists = async (req: Request, res: Response) => {
    try {
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = (email as string).toLowerCase().trim();
        
        // Use findFirst with role filter to allow same email for different roles
        const user = await prisma.user.findFirst({
            where: { 
                email: normalizedEmail,
                ...(role ? { role: role as any } : {})
            }
        });

        if (!user) {
            return res.json({ success: true, exists: false });
        }

        return res.json({
            success: true,
            exists: true,
            role: user.role,
            message: `This email is already registered as a ${user.role}. Please use a different email.`
        });
    } catch (error: any) {
        console.error('Error in checkEmailExists:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const checkInstitutionPhone = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        logToFile(`[checkInstitutionPhone] Checking phone: ${phone}, Normalized: ${normalizedPhone}`);
        
        // Find ALL roles for this phone
        const users = await prisma.user.findMany({
            where: { phone: normalizedPhone }
        });
        
        logToFile(`[checkInstitutionPhone] Found ${users.length} users with this phone`);
        users.forEach(u => logToFile(` - User ID: ${u.id}, Role: ${u.role}, Email: ${u.email}, Verified: ${u.isVerified}`));

        const hasInstitutionRole = users.some(u => u.role === 'INSTITUTION');

        if (hasInstitutionRole) {
            return res.json({
                success: true,
                isInstitutionRegistered: true,
                message: 'This number is already registered as a Temple/Institution. Please login instead.'
            });
        }
        
        return res.json({
            success: true,
            isInstitutionRegistered: false
        });
    } catch (error: any) {
        console.error('Error in checkInstitutionPhone:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
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
        let otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Static OTP for special test number pratham
        if (normalizedPhone === '+919399805327') {
            otp = '123456'; // Use 6 digits to match standard OTP length
        }

        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const checkRole = role || 'DEVOTEE';

        // Strict Mode Handling: Default to 'login' if mode is not provided
        let effectiveMode = mode || 'login'; 

        // Security check: Never allow registration via simple OTP for complex roles
        if (checkRole === 'INSTITUTION' || checkRole === 'SELLER' || checkRole === 'MANDAL') {
            effectiveMode = 'login';
        }

        const isRegisterFlow = effectiveMode === 'register';

        const phoneVariants = getPhoneVariants(normalizedPhone);

        // 1. Check if user exists WITH THE SAME ROLE (matching any phone variant)
        let existingUser = await prisma.user.findFirst({
            where: { phone: { in: phoneVariants }, role: checkRole as any }
        });

        // 2. Fallback: If no User record exists, check if an approved Mandal exists for this phone
        if (!existingUser && checkRole === 'MANDAL') {
            const approvedMandal = await prisma.mandal.findFirst({
                where: {
                    contactNumber: { in: phoneVariants },
                    status: 'APPROVED'
                }
            });

            if (approvedMandal) {
                let nameStr = approvedMandal.presidentName || 'Mandal Admin';
                try {
                    const nameObj = typeof approvedMandal.name === 'string' ? JSON.parse(approvedMandal.name) : approvedMandal.name;
                    nameStr = (nameObj as any)?.en || (nameObj as any)?.hi || (nameObj as any)?.mr || nameStr;
                } catch (e) {}

                const displayId = await generateCustomId('MNID');
                existingUser = await prisma.user.create({
                    data: {
                        displayId,
                        phone: normalizedPhone,
                        name: nameStr,
                        email: approvedMandal.email ? approvedMandal.email.toLowerCase().trim() : null,
                        role: 'MANDAL',
                        isVerified: true,
                        isActive: true
                    }
                });

                await prisma.mandal.update({
                    where: { id: approvedMandal.id },
                    data: { userId: existingUser.id, contactNumber: normalizedPhone }
                });
            }
        }

        // 3. Fallback: If no User record exists, check if an active Temple exists for this phone
        if (!existingUser && checkRole === 'INSTITUTION') {
            const existingTemple = await prisma.temple.findFirst({
                where: {
                    phone: { in: phoneVariants },
                    isActive: true
                }
            });

            if (existingTemple) {
                let nameStr = 'Temple Admin';
                try {
                    const nameObj = typeof existingTemple.name === 'string' ? JSON.parse(existingTemple.name) : existingTemple.name;
                    nameStr = (nameObj as any)?.en || (nameObj as any)?.hi || (nameObj as any)?.mr || nameStr;
                } catch (e) {}

                const displayId = await generateCustomId('TAID');
                existingUser = await prisma.user.create({
                    data: {
                        displayId,
                        phone: normalizedPhone,
                        name: nameStr,
                        role: 'INSTITUTION',
                        isVerified: true,
                        isActive: true
                    }
                });

                await prisma.temple.update({
                    where: { id: existingTemple.id },
                    data: { userId: existingUser.id, phone: normalizedPhone }
                });
            }
        }

        if (existingUser) {
            // Same role found — if registering and already verified → tell them to login
            if (isRegisterFlow && existingUser.isVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'This mobile number is already registered with us. Please login instead.'
                });
            }

            // Ensure phone is stored in normalized +91 format
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { otp, otpExpires, phone: normalizedPhone }
            });
        } else {
            // No user with this phone + role found
            if (!isRegisterFlow && checkRole !== 'DEVOTEE') {
                // Check if this number exists in the Lead table (only for MANDAL/INSTITUTION)
                const existingLead = await prisma.lead.findFirst({
                    where: { phone: { in: phoneVariants } }
                });

                const roleLabel = checkRole === 'MANDAL' ? 'mandal' : 'temple';

                if (existingLead) {
                    return res.status(404).json({
                        success: false,
                        isLead: true,
                        message: `Registration incomplete. Please complete your ${roleLabel} registration.`
                    });
                } else {
                    return res.status(404).json({
                        success: false,
                        isLead: false,
                        message: checkRole === 'MANDAL'
                            ? 'This number is not registered with us. Please register your mandal to continue.'
                            : 'This number is not registered with us. Please register to continue.'
                    });
                }
            }

            // Check if email is already taken for THIS ROLE specifically
            if (email) {
                const normalizedEmail = email.toLowerCase().trim();
                const existingEmail = await prisma.user.findFirst({
                    where: { 
                        email: normalizedEmail,
                        role: checkRole as any
                    }
                });
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: `The email address ${email} is already registered. Please use a unique email or different mobile number.`
                    });
                }
            }
        }

        await createOtpVerification({
            phone: normalizedPhone,
            role: checkRole,
            otp,
            otpExpires,
            isRegisterFlow,
            name: name ? name.trim() : undefined,
            email: email ? email.toLowerCase().trim() : undefined
        });

        // Skip actual SMS/WA sending for the static test number
        if (normalizedPhone !== '+919399805327') {
            // Send OTP via Mobicomm SMS
            const message = `Your OTP for DevBhakti login is ${otp}. Valid for 5 minutes. Do not share this code with anyone. `;
            const smsSent = await sendSMS(normalizedPhone, message);

            if (smsSent) {
                console.log(`[Auth] OTP sent successfully to ${normalizedPhone}`);
            } else {
                console.log(`[Auth] Failed to send OTP to ${normalizedPhone}. Check Mobicomm logs.`);
            }

            // Send OTP via WhatsApp (AiSensy)
            try {
                await sendWhatsAppMessage(
                    normalizedPhone,
                    name || 'Bhakt',
                    "otp_login", // Assuming this template name
                    [otp]
                );
            } catch (waError) {
                console.error("Failed to send WhatsApp OTP:", waError);
            }
        } else {
            console.log(`[Auth] Skipped sending real SMS/WA for test number ${normalizedPhone}`);
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
        res.json({ 
            success: true, 
            message: 'OTP sent successfully', 
            data: { 
                phone: normalizedPhone,
                isNewUser: !existingUser  // ✅ true = new user, false = existing
            } 
        });

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

        // @ts-ignore: otpVerification model may not be present in generated Prisma client yet
        let otpVerification: any = await prismaAny['otpVerification'].findFirst({
            where: {
                phone: normalizedPhone,
                role: checkRole as any,
                otp: String(otp),
                isUsed: false,
                otpExpires: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        const phoneVariants = getPhoneVariants(normalizedPhone);

        let user = await prisma.user.findFirst({
            where: {
                phone: { in: phoneVariants },
                role: checkRole as any
            }
        });

        // Legacy fallback for old otp storage on user record
        if (!otpVerification && user) {
            const isOtpMatch = String(user.otp) === String(otp);
            const isNotExpired = user.otpExpires ? user.otpExpires > new Date() : false;
            if (isOtpMatch && isNotExpired) {
                otpVerification = undefined as any; // allow legacy path
            }
        }

        if (!otpVerification && !user) {
            return res.status(400).json({ success: false, message: 'Invalid OTP or registration session expired' });
        }

        const isRegisterFlow = otpVerification ? otpVerification.isRegisterFlow : false;

        if (!user && !isRegisterFlow && checkRole !== 'DEVOTEE') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user && (isRegisterFlow || checkRole === 'DEVOTEE')) {
            user = await prisma.user.create({
                data: {
                    displayId: await generateCustomId(checkRole === 'INSTITUTION' ? 'TAID' : 'UID'),
                    phone: normalizedPhone,
                    name: otpVerification?.name || 'Devotee',
                    email: otpVerification?.email ? otpVerification.email.toLowerCase().trim() : null,
                    role: checkRole as any,
                    isVerified: checkRole === 'DEVOTEE',
                    otp: null,
                    otpExpires: null
                }
            });
        }

        if (user) {
            if ((user.role === 'INSTITUTION' || user.role === 'SELLER' || user.role === 'MANDAL') && !user.isVerified) {
                if (normalizedPhone !== '+919399805327') {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account is inactive or pending approval. Please contact admin.'
                    });
                }
            }

            const updateData: any = {
                otp: null,
                otpExpires: null
            };

            if (user.role === 'DEVOTEE') {
                updateData.isVerified = true;
            }
            if (otpVerification?.name && (user.name === 'Devotee' || !user.name)) {
                updateData.name = otpVerification.name;
            }

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
            user = updatedUser;
        }

        if (otpVerification) {
            // @ts-ignore: otpVerification model may not be present in generated Prisma client yet
            await prismaAny['otpVerification'].update({
                where: { id: otpVerification.id },
                data: { isUsed: true }
            });
        }

        if (user) {
            await linkDonationsToUser(user.id, normalizedPhone, user.email);
        }

        const token = jwt.sign(
            { userId: user!.id, phone: user!.phone, role: user!.role },
            JWT_SECRET,
            { expiresIn: '90d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user!.id,
                    name: user!.name,
                    phone: user!.phone,
                    email: user!.email,
                    role: user!.role,
                    profileImage: user!.profileImage,
                    gothra: user!.gothra,
                    kuldevi: user!.kuldevi,
                    kuldevta: user!.kuldevta,
                    dob: user!.dob,
                    anniversary: user!.anniversary,
                    address: user!.address,
                    nativePlace: user!.nativePlace,
                    isVerified: user!.isVerified
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
        const { name, email, gothra, kuldevi, kuldevta, dob, anniversary, address, nativePlace, phone } = req.body;
        const profileImage = req.file ? `/uploads/users/${req.file.filename}` : undefined;

        // If email is being updated, check if it's already taken by another user with the SAME ROLE
        if (email) {
            const userRole = (req as any).user.role;
            const existingEmail = await prisma.user.findFirst({
                where: { 
                    email: email.toLowerCase().trim(),
                    role: userRole
                }
            });

            // If email exists and belongs to a different user record
            if (existingEmail && existingEmail.id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: `The email address ${email} is already registered to another ${userRole} account. Please use a unique email address.`
                });
            }
        }

        // If phone is being updated, check if it's already taken by another user with the SAME ROLE
        if (phone) {
            const userRole = (req as any).user.role;
            const normalizedPhone = normalizePhone(phone);
            const existingPhone = await prisma.user.findFirst({
                where: { 
                    phone: normalizedPhone,
                    role: userRole
                }
            });

            if (existingPhone && existingPhone.id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: `The phone number ${phone} is already registered to another ${userRole} account.`
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
            address,
            nativePlace
        };

        // Only update email if provided
        if (email) {
            updateData.email = email.toLowerCase().trim();
        }

        // Only update phone if provided
        if (phone) {
            updateData.phone = normalizePhone(phone);
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
                    address: updatedUser.address,
                    nativePlace: updatedUser.nativePlace
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
                nativePlace: true,
                isVerified: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const lang = getLang(req);
        res.json({ success: true, data: { user: localize(user, lang) } });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).user;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                bookings: true,
                orders: true,
                donations: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user has financial records to decide on hard or soft delete
        const hasFinancialRecords = 
            (user.bookings && user.bookings.length > 0) || 
            (user.orders && user.orders.length > 0) || 
            (user.donations && user.donations.length > 0);

        if (hasFinancialRecords) {
            // Soft delete + Anonymize to preserve temple's financial records without foreign key errors
            const timestamp = Date.now();
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isActive: false,
                    phone: user.phone ? `${user.phone}_deleted_${timestamp}` : null,
                    email: user.email ? `${user.email}_deleted_${timestamp}` : null,
                    name: 'Deleted User',
                    // Clear personal info
                    address: null,
                    nativePlace: null,
                    dob: null,
                    anniversary: null,
                    gothra: null,
                    kuldevi: null,
                    kuldevta: null,
                    profileImage: null,
                    otp: null,
                    otpExpires: null
                }
            });
            console.log(`[deleteAccount] Soft deleted and anonymized user ${userId} due to financial records.`);
        } else {
            // Delete related rows first to avoid Prisma relation errors
            await prisma.cart.deleteMany({ where: { userId } });
            await prisma.favorite.deleteMany({ where: { userId } });

            // Hard delete user
            await prisma.user.delete({
                where: { id: userId }
            });
            console.log(`[deleteAccount] Hard deleted user ${userId}.`);
        }

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: 'Internal server error while deleting account' });
    }
};
