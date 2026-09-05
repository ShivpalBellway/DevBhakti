import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { sendEmail } from '../../utils/sendEmail';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';
const ADMIN_PASSWORD_CHANGE_NOTIFICATION_EMAIL = 'shivanikushwahbellway@gmail.com';

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email and ensure they are an ADMIN
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || user.role !== 'ADMIN' || !user.password) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Admin login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const staffForgotPasswordRequest = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if a staff member exists with this email
    const staff = await prisma.staffMember.findUnique({
      where: { email },
    });

    if (!staff) {
      // Return success even if not found to prevent email enumeration,
      // or return an error if you strictly want to let them know.
      // Opting for an error here since it's an internal tool.
      return res.status(404).json({ error: 'No staff member found with this email' });
    }

    // Send a notification to all super admins
    const { notifyAdmins } = await import('../../services/firebaseService');
    await notifyAdmins({
      title: "Password Reset Request",
      body: `Staff member ${staff.name} (${staff.email}) has requested a password reset. Please go to Staff Management to reset it.`
    });

    res.json({
      success: true,
      message: 'Password reset request sent to the administrator.',
    });
  } catch (error) {
    console.error('Staff forgot password request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendAdminPasswordChangeOTP = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { oldPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!oldPassword) {
      return res.status(400).json({ error: 'Old password is required' });
    }

    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN' || !admin.password) {
      return res.status(403).json({ error: 'Unauthorized admin user' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid old password' });
    }

    if (!admin.email) {
      return res.status(400).json({ error: 'Admin account has no email configured' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: admin.id },
      data: {
        otp,
        otpExpires,
      },
    });

    const emailText = `Your DevBhakti Admin password change OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`;
    const emailResult = await sendEmail(
      ADMIN_PASSWORD_CHANGE_NOTIFICATION_EMAIL,
      'DevBhakti password change OTP',
      emailText
    );

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send admin password change OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changeAdminPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { oldPassword, otp, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!oldPassword || !otp || !newPassword) {
      return res.status(400).json({ error: 'Old password, OTP and new password are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN' || !admin.password) {
      return res.status(403).json({ error: 'Unauthorized admin user' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid old password' });
    }

    if (!admin.otp || String(admin.otp) !== String(otp) || !admin.otpExpires || admin.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null,
      },
    });

    const notificationText = `Admin password for ${admin.email || 'ADMIN'} was changed successfully.`;
    await sendEmail(
      ADMIN_PASSWORD_CHANGE_NOTIFICATION_EMAIL,
      'DevBhakti admin password changed',
      notificationText
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// controllers/adminController.ts - Add this new function

export const verifyAdminOTP = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { otp } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const admin = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized admin user' });
    }

    // Check if OTP exists and is valid
    if (!admin.otp || !admin.otpExpires) {
      return res.status(400).json({ error: 'No OTP request found. Please request OTP first.' });
    }

    // Check if OTP is expired
    if (admin.otpExpires < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify OTP
    if (String(admin.otp) !== String(otp)) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};