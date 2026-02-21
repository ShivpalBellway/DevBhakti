import { PrismaClient, OwnerType } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // ── ADMIN PANEL PERMISSIONS ──────────────────────────────
  { key: 'dashboard.view',      module: 'dashboard',  label: 'View Dashboard',          applicableTo: [OwnerType.ADMIN] },
  { key: 'users.view',          module: 'users',      label: 'View Users',              applicableTo: [OwnerType.ADMIN] },
  { key: 'users.manage',        module: 'users',      label: 'Manage Users',            applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.view',        module: 'temples',    label: 'View Temples',            applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.approve',     module: 'temples',    label: 'Approve/Reject Temples',  applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.manage',      module: 'temples',    label: 'Manage Temples',          applicableTo: [OwnerType.ADMIN] },
  { key: 'sellers.view',        module: 'sellers',    label: 'View Sellers',            applicableTo: [OwnerType.ADMIN] },
  { key: 'sellers.approve',     module: 'sellers',    label: 'Approve/Reject Sellers',  applicableTo: [OwnerType.ADMIN] },
  { key: 'sellers.manage',      module: 'sellers',    label: 'Manage Sellers',          applicableTo: [OwnerType.ADMIN] },
  { key: 'products.view',       module: 'products',   label: 'View Products',           applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER] },
  { key: 'products.edit',       module: 'products',   label: 'Edit Products',           applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER] },
  { key: 'products.delete',     module: 'products',   label: 'Delete Products',         applicableTo: [OwnerType.ADMIN] },
  { key: 'categories.view',     module: 'categories', label: 'View Categories',         applicableTo: [OwnerType.ADMIN] },
  { key: 'categories.manage',   module: 'categories', label: 'Manage Categories',       applicableTo: [OwnerType.ADMIN] },
  { key: 'poojas.view',         module: 'poojas',     label: 'View Poojas',             applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'poojas.manage',       module: 'poojas',     label: 'Manage Poojas',           applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'events.view',         module: 'events',     label: 'View Events',             applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'events.manage',       module: 'events',     label: 'Manage Events',           applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'bookings.view',       module: 'bookings',   label: 'View Bookings',           applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'bookings.manage',     module: 'bookings',   label: 'Manage Bookings',         applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'orders.view',         module: 'orders',     label: 'View Orders',             applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER] },
  { key: 'orders.manage',       module: 'orders',     label: 'Manage Orders',           applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER] },
  { key: 'finance.view',        module: 'finance',    label: 'View Finance',            applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER] },
  { key: 'finance.manage',      module: 'finance',    label: 'Manage Finance',          applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.view',            module: 'cms',        label: 'View CMS',                applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.edit',            module: 'cms',        label: 'Edit CMS',                applicableTo: [OwnerType.ADMIN] },
  { key: 'commission.view',     module: 'commission', label: 'View Commission Slabs',   applicableTo: [OwnerType.ADMIN] },
  { key: 'commission.manage',   module: 'commission', label: 'Manage Commission Slabs', applicableTo: [OwnerType.ADMIN] },

  // ── TEMPLE PANEL PERMISSIONS ─────────────────────────────
  { key: 'temple.profile.view',   module: 'temple',   label: 'View Temple Profile',     applicableTo: [OwnerType.TEMPLE] },
  { key: 'temple.profile.edit',   module: 'temple',   label: 'Edit Temple Profile',     applicableTo: [OwnerType.TEMPLE] },
  { key: 'temple.devotees.view',  module: 'temple',   label: 'View Devotees',           applicableTo: [OwnerType.TEMPLE] },
  { key: 'temple.bank.view',      module: 'temple',   label: 'View Bank Details',       applicableTo: [OwnerType.TEMPLE] },
  { key: 'temple.bank.manage',    module: 'temple',   label: 'Manage Bank Details',     applicableTo: [OwnerType.TEMPLE] },

  // ── SELLER PANEL PERMISSIONS ─────────────────────────────
  { key: 'seller.profile.view',   module: 'seller',   label: 'View Seller Profile',     applicableTo: [OwnerType.SELLER] },
  { key: 'seller.profile.edit',   module: 'seller',   label: 'Edit Seller Profile',     applicableTo: [OwnerType.SELLER] },

  // ── STAFF MANAGEMENT (common for all owners) ─────────────
  { key: 'staff.view',    module: 'staff', label: 'View Staff Members',   applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER] },
  { key: 'staff.manage',  module: 'staff', label: 'Manage Staff & Roles', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER] },
];

async function main() {
  console.log('🌱 Seeding permissions...');

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        label: perm.label,
        applicableTo: perm.applicableTo,
      },
      create: perm,
    });
  }

  console.log(`✅ ${permissions.length} permissions seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
