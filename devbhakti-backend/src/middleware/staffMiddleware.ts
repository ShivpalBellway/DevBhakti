import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OwnerType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

export interface StaffRequest extends Request {
  staff?: {
    staffId: string;
    ownerType: OwnerType;
    ownerId: string;
    isStaff: boolean;
    permissions: string[];
  };
}

// ────────────────────────────────────────────────────────────
// Middleware: Authenticate Staff JWT
// ────────────────────────────────────────────────────────────
export const authenticateStaff = (
  req: StaffRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded.isStaff) {
      return res.status(403).json({ error: 'Not a staff token' });
    }

    req.staff = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ────────────────────────────────────────────────────────────
// Middleware: Check specific permission key
// Usage: hasPermission('bookings.view')
// ────────────────────────────────────────────────────────────
export const hasPermission = (...requiredPerms: string[]) => {
  return (req: StaffRequest, res: Response, next: NextFunction) => {
    const permissions = req.staff?.permissions || [];

    const hasAll = requiredPerms.every((p) => permissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        error: `Access denied. Required permission(s): ${requiredPerms.join(', ')}`,
      });
    }

    next();
  };
};

// ────────────────────────────────────────────────────────────
// Middleware: Verify staff belongs to correct owner context
// e.g. Temple Staff can only access THEIR temple's data
// Usage: verifyOwnerContext('TEMPLE', (req) => req.params.templeId)
// ────────────────────────────────────────────────────────────
export const verifyOwnerContext = (
  expectedOwnerType: OwnerType,
  getResourceOwnerId?: (req: StaffRequest) => string | undefined
) => {
  return (req: StaffRequest, res: Response, next: NextFunction) => {
    const staff = req.staff;

    if (!staff) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    if (staff.ownerType !== expectedOwnerType) {
      return res.status(403).json({
        error: `Access denied. This route is for ${expectedOwnerType} staff only.`,
      });
    }

    // Optionally check that the requested resource belongs to this owner
    if (getResourceOwnerId) {
      const resourceOwnerId = getResourceOwnerId(req);
      if (resourceOwnerId && resourceOwnerId !== staff.ownerId) {
        return res.status(403).json({
          error: 'Access denied. You can only access your own data.',
        });
      }
    }

    next();
  };
};
