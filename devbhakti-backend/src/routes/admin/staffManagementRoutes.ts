import express, { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, checkPermission } from '../../middleware/authMiddleware';
import { staffLogin, getStaffMe } from '../../controllers/shared/staffAuthController';
import {
  getStaffMembers, createStaffMember, updateStaffMember, deleteStaffMember, resetStaffPassword,
  getRoles, createRole, updateRole, deleteRole, getPermissions,
} from '../../controllers/shared/rbacController';

const router = express.Router();

// ── Inject owner context for Admin panel ─────────────────────
const injectAdminOwner = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).owner = { ownerType: 'ADMIN', ownerId: 'SUPER_ADMIN' };
  next();
};

// ── Staff Login (public) ──────────────────────────────────────
router.post('/login', staffLogin);

// ── All routes below require Authentication ──
router.use(authenticate, injectAdminOwner);

// Staff Me (Anyone who is logged in can fetch their own info)
router.get('/me', getStaffMe);

// Staff Members
router.get('/staff', checkPermission('team.staff.view'), getStaffMembers);
router.post('/staff', checkPermission('team.staff.manage'), createStaffMember);
router.patch('/staff/:id', checkPermission('team.staff.manage'), updateStaffMember);
router.delete('/staff/:id', checkPermission('team.staff.manage'), deleteStaffMember);
router.post('/staff/:id/reset-password', checkPermission('team.staff.manage'), resetStaffPassword);

// Roles
router.get('/roles', checkPermission('team.roles.manage'), getRoles);
router.post('/roles', checkPermission('team.roles.manage'), createRole);
router.patch('/roles/:id', checkPermission('team.roles.manage'), updateRole);
router.delete('/roles/:id', checkPermission('team.roles.manage'), deleteRole);

// Permissions (read-only, used when creating roles)
router.get('/permissions', checkPermission('team.roles.manage'), getPermissions);

export default router;
