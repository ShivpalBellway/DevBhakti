import express from 'express';
import { staffLogin, getStaffMe } from '../../controllers/shared/staffAuthController';
import {
  getStaffMembers, createStaffMember, updateStaffMember, deleteStaffMember,
  getRoles, createRole, updateRole, deleteRole, getPermissions,
} from '../../controllers/shared/rbacController';
import { authenticate, checkPermission, injectSellerContext } from '../../middleware/authMiddleware';

const router = express.Router();

// ── Staff Login (public) ──────────────────────────────────────
router.post('/login', staffLogin);

// ── All routes below require Auth and Seller context ──
router.use(authenticate, injectSellerContext);

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
