import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { OwnerType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

// ────────────────────────────────────────────────────────────────
// Helper: Get all permissions for a staff member across all roles
// ────────────────────────────────────────────────────────────────
const getStaffPermissions = async (staffId: string): Promise<string[]> => {
  const staffRoles = await prisma.staffRole.findMany({
    where: { staffId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permSet = new Set<string>();
  staffRoles.forEach((sr) => {
    sr.role.rolePermissions.forEach((rp) => {
      permSet.add(rp.permission.key);
    });
  });

  return Array.from(permSet);
};

// ────────────────────────────────────────────────────────────────
// POST /api/admin/staff-auth/login
// POST /api/temple-admin/staff-auth/login
// POST /api/seller/staff-auth/login
// ────────────────────────────────────────────────────────────────
export const staffLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const staff = await prisma.staffMember.findUnique({
      where: { email },
    });

    if (!staff || !staff.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or account disabled' });
    }

    const isValid = await bcrypt.compare(password, staff.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch all permissions from all assigned roles
    const permissions = await getStaffPermissions(staff.id);

    // Create JWT with staff info + permissions
    const token = jwt.sign(
      {
        staffId: staff.id,
        ownerType: staff.ownerType,
        ownerId: staff.ownerId,
        isStaff: true,
        permissions,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...staffWithoutPassword } = staff;

    return res.json({
      success: true,
      message: 'Staff login successful',
      token,
      staff: { ...staffWithoutPassword, permissions },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ────────────────────────────────────────────────────────────────
// GET /api/*/staff-auth/me  — Get current staff info
// ────────────────────────────────────────────────────────────────
export const getStaffMe = async (req: Request, res: Response) => {
  try {
    const staffId = (req as any).staff?.staffId;

    const staff = await prisma.staffMember.findUnique({
      where: { id: staffId },
      include: {
        staffRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const permissions = await getStaffPermissions(staffId);
    const { password: _, ...staffWithoutPassword } = staff;

    return res.json({
      success: true,
      data: { ...staffWithoutPassword, permissions },
    });
  } catch (error) {
    console.error('Get staff me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
