import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email and ensure they are an ADMIN
    const user = await prisma.user.findUnique({
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
      { expiresIn: '24h' }
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
