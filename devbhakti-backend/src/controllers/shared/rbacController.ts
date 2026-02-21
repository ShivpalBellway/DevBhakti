import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { OwnerType } from '@prisma/client';

// ────────────────────────────────────────────────────────────
// STAFF MEMBER APIs
// ────────────────────────────────────────────────────────────

// GET  /staff → List all staff of this owner
export const getStaffMembers = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner; // set by route-level middleware

    const staffList = await prisma.staffMember.findMany({
      where: { ownerType, ownerId },
      include: {
        staffRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: { select: { key: true, label: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = staffList.map(({ password, ...s }) => ({
      ...s,
      roles: s.staffRoles.map((sr) => ({
        id: sr.role.id,
        name: sr.role.name,
        permissions: sr.role.rolePermissions.map((rp) => rp.permission),
      })),
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /staff → Create new staff member
export const createStaffMember = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner;
    const { name, email, password, roleIds = [] } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await prisma.staffMember.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Validate roleIds belong to this owner
    if (roleIds.length > 0) {
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds }, ownerType, ownerId },
      });
      if (roles.length !== roleIds.length) {
        return res.status(400).json({ error: 'One or more roles are invalid' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.staffMember.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ownerType,
        ownerId,
        staffRoles: {
          create: roleIds.map((roleId: string) => ({ roleId })),
        },
      },
      include: {
        staffRoles: { include: { role: true } },
      },
    });

    const { password: _, ...staffData } = staff;
    return res.status(201).json({ success: true, data: staffData });
  } catch (error) {
    console.error('Create staff error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /staff/:id → Update staff member
export const updateStaffMember = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner;
    const id = req.params.id as string;
    const { name, email, password, isActive, roleIds } = req.body;

    const staff = await prisma.staffMember.findFirst({
      where: { id, ownerType, ownerId },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const updateData: any = {};
    if (name)     updateData.name = name;
    if (email)    updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update roles if provided
    if (roleIds !== undefined) {
      if (roleIds.length > 0) {
        const roles = await prisma.role.findMany({
          where: { id: { in: roleIds }, ownerType, ownerId },
        });
        if (roles.length !== roleIds.length) {
          return res.status(400).json({ error: 'One or more roles are invalid' });
        }
      }

      // Replace all roles
      await prisma.staffRole.deleteMany({ where: { staffId: id as string } });
      if (roleIds.length > 0) {
        await prisma.staffRole.createMany({
          data: roleIds.map((roleId: string) => ({ staffId: id as string, roleId })),
        });
      }
    }

    const updated = await prisma.staffMember.update({
      where: { id: id as string },
      data: updateData,
      include: {
        staffRoles: { include: { role: true } },
      },
    });

    const { password: _, ...staffData } = updated;
    return res.json({ success: true, data: staffData });
  } catch (error) {
    console.error('Update staff error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /staff/:id → Delete staff member
export const deleteStaffMember = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner;
    const id = req.params.id as string;

    const staff = await prisma.staffMember.findFirst({
      where: { id, ownerType, ownerId },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    await prisma.staffMember.delete({ where: { id } });
    return res.json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    console.error('Delete staff error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// ────────────────────────────────────────────────────────────
// ROLE APIs
// ────────────────────────────────────────────────────────────

// GET  /roles → List roles of this owner
export const getRoles = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner;

    const roles = await prisma.role.findMany({
      where: { ownerType, ownerId },
      include: {
        rolePermissions: {
          include: { permission: { select: { key: true, label: true, module: true } } },
        },
        _count: { select: { staffRoles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: roles });
  } catch (error) {
    console.error('Get roles error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /roles → Create a new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner;
    const { name, description, permissionKeys = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    // Validate permissions exist and are applicable to this ownerType
    let permissionIds: string[] = [];
    if (permissionKeys.length > 0) {
      const perms = await prisma.permission.findMany({
        where: {
          key: { in: permissionKeys },
          applicableTo: { has: ownerType },
        },
      });

      if (perms.length !== permissionKeys.length) {
        return res.status(400).json({
          error: 'Some permission keys are invalid or not applicable to your panel',
        });
      }
      permissionIds = perms.map((p) => p.id);
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        ownerType,
        ownerId,
        rolePermissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: { select: { key: true, label: true } } },
        },
      },
    });

    return res.status(201).json({ success: true, data: role });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A role with this name already exists' });
    }
    console.error('Create role error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /roles/:id → Update role name/description/permissions
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner;
    const id = req.params.id as string;
    const { name, description, permissionKeys } = req.body;

    const role = await prisma.role.findFirst({
      where: { id, ownerType, ownerId },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const updateData: any = {};
    if (name)        updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Replace permissions if provided
    if (permissionKeys !== undefined) {
      let permissionIds: string[] = [];

      if (permissionKeys.length > 0) {
        const perms = await prisma.permission.findMany({
          where: {
            key: { in: permissionKeys },
            applicableTo: { has: ownerType },
          },
        });

        if (perms.length !== permissionKeys.length) {
          return res.status(400).json({
            error: 'Some permissions are invalid or not applicable',
          });
        }
        permissionIds = perms.map((p) => p.id);
      }

      await prisma.rolePermission.deleteMany({ where: { roleId: id as string } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: id as string, permissionId })),
        });
      }
    }

    const updated = await prisma.role.update({
      where: { id: id as string },
      data: updateData,
      include: {
        rolePermissions: {
          include: { permission: { select: { key: true, label: true } } },
        },
        _count: { select: { staffRoles: true } },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /roles/:id → Delete a role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { ownerType, ownerId } = (req as any).owner;
    const id = req.params.id as string;

    const role = await prisma.role.findFirst({
      where: { id, ownerType, ownerId },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await prisma.role.delete({ where: { id } });
    return res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    console.error('Delete role error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// ────────────────────────────────────────────────────────────
// PERMISSIONS API — Read-only (seeded, not editable)
// ────────────────────────────────────────────────────────────

// GET /permissions → List permissions applicable to this owner's panel
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const { ownerType } = (req as any).owner;

    const permissions = await prisma.permission.findMany({
      where: { applicableTo: { has: ownerType } },
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });

    // Group by module for easier frontend rendering
    const grouped = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push({ key: perm.key, label: perm.label, id: perm.id });
      return acc;
    }, {});

    return res.json({ success: true, data: grouped });
  } catch (error) {
    console.error('Get permissions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
