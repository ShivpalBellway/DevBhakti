import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

interface AuthRequest extends Request {
  user?: {
    userId?: string;
    staffId?: string;
    role?: string;
    isStaff?: boolean;
    permissions?: string[];
    ownerType?: string;
    ownerId?: string;
  };
  owner?: {
    ownerType: string;
    ownerId: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role && roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Access denied: Unauthorized role' });
  };
};

export const checkPermission = (permissionKey: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Platform Admins, Temple Owners, and Seller Owners bypass all checks
    if (req.user.role === 'ADMIN' || req.user.role === 'INSTITUTION' || req.user.role === 'SELLER') {
      return next();
    }

    // Check staff permissions
    const permissions = req.user.permissions || [];
    if (permissions.includes(permissionKey)) {
      return next();
    }

    return res.status(403).json({ error: `Access denied: Missing permission '${permissionKey}'` });
  };
};

/**
 * Middleware to inject Temple context (templeId) for Owners/Staff
 */
export const injectTempleContext = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    // Handle Staff
    if (user.isStaff && user.ownerType === 'TEMPLE') {
      req.owner = { ownerType: 'TEMPLE', ownerId: user.ownerId! };
      return next();
    }

    // Handle Temple Owner (INSTITUTION)
    if (user.role === 'INSTITUTION') {
      const temple = await prisma.temple.findUnique({ 
        where: { userId: user.userId },
        select: { id: true }
      });
      
      if (!temple) {
        return res.status(404).json({ error: 'Temple profile not found' });
      }
      
      req.owner = { ownerType: 'TEMPLE', ownerId: temple.id };
      return next();
    }

    return res.status(403).json({ error: 'Unauthorized: Temple access required' });
  } catch (error) {
    console.error('Inject Temple Context Error:', error);
    return res.status(500).json({ error: 'Internal server error while resolving context' });
  }
};

/**
 * Middleware to inject Seller context (sellerId) for Owners/Staff
 */
export const injectSellerContext = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    // Handle Staff
    if (user.isStaff && user.ownerType === 'SELLER') {
      req.owner = { ownerType: 'SELLER', ownerId: user.ownerId! };
      return next();
    }

    // Handle Seller Owner (SELLER)
    if (user.role === 'SELLER') {
      const seller = await prisma.sellerProfile.findUnique({ 
        where: { userId: user.userId },
        select: { id: true }
      });
      
      if (!seller) {
        return res.status(404).json({ error: 'Seller profile not found' });
      }
      
      req.owner = { ownerType: 'SELLER', ownerId: seller.id };
      return next();
    }

    return res.status(403).json({ error: 'Unauthorized: Seller access required' });
  } catch (error) {
    console.error('Inject Seller Context Error:', error);
    return res.status(500).json({ error: 'Internal server error while resolving context' });
  }
};
