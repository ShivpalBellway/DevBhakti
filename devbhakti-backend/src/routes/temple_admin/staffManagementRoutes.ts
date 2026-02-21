import express, { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { staffLogin, getStaffMe } from '../../controllers/shared/staffAuthController';
import {
  getStaffMembers, createStaffMember, updateStaffMember, deleteStaffMember,
  getRoles, createRole, updateRole, deleteRole, getPermissions,
} from '../../controllers/shared/rbacController';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';

const router = express.Router();

// ── Inject Temple owner context ────────────────────────────────
// Finds the templeId from the logged-in user (Owner or Staff)
const injectTempleOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (user.isStaff && user.ownerType === 'TEMPLE') {
      (req as any).owner = { ownerType: 'TEMPLE', ownerId: user.ownerId };
      return next();
    }

    if (user.role === 'INSTITUTION') {
      const temple = await prisma.temple.findUnique({ where: { userId: user.userId } });
      if (!temple) {
        return res.status(404).json({ error: 'Temple not found for this account' });
      }
      (req as any).owner = { ownerType: 'TEMPLE', ownerId: temple.id };
      return next();
    }

    return res.status(403).json({ error: 'Unauthorized: Not a temple owner or staff' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Staff Login (public) ──────────────────────────────────────
router.post('/login', staffLogin);

// ── All routes below require Auth and Temple context ──
router.use(authenticate, injectTempleOwner);

// Staff Me
router.get('/me', getStaffMe);

// Staff Members
router.get('/staff', checkPermission('team.staff.view'), getStaffMembers);
router.post('/staff', checkPermission('team.staff.manage'), createStaffMember);
router.patch('/staff/:id', checkPermission('team.staff.manage'), updateStaffMember);
router.delete('/staff/:id', checkPermission('team.staff.manage'), deleteStaffMember);

// Roles
router.get('/roles', checkPermission('team.roles.manage'), getRoles);
router.post('/roles', checkPermission('team.roles.manage'), createRole);
router.patch('/roles/:id', checkPermission('team.roles.manage'), updateRole);
router.delete('/roles/:id', checkPermission('team.roles.manage'), deleteRole);

// Permissions
router.get('/permissions', checkPermission('team.roles.manage'), getPermissions);

export default router;
