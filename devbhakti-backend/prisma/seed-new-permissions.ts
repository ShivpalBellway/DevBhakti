import { PrismaClient, OwnerType } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // ── DASHBOARD ───────────────────────────────────────────
  {
    key: 'dashboard.view',
    module: 'dashboard',
    label: 'Show Dashboard Link',
    description: 'Allows the user to see the Dashboard link in the sidebar and access the main overview page.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },

  // ── TEMPLES MANAGEMENT ──────────────────────────────────
  {
    key: 'temples.menu',
    module: 'temples',
    label: 'Show Temples Menu',
    description: 'Displays the "Temples" category in the sidebar menu.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'temples.view',
    module: 'temples',
    label: 'View Temples List',
    description: 'Allows the user to view the table of all registered temples and search through them.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'temples.create',
    module: 'temples',
    label: 'Add New Temple',
    description: 'Enables the "Add New Temple" button and access to the temple creation form.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'temples.edit',
    module: 'temples',
    label: 'Edit Temple Details',
    description: 'Allows editing of temple information, contact details, and images.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'temples.verify',
    module: 'temples',
    label: 'Approve/Reject Verification',
    description: 'Allows the staff to verify new temple registrations and mark them as active.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'temples.requests_view',
    module: 'temples',
    label: 'View Update Requests',
    description: 'Allows viewing of profile update requests submitted by temple owners.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'temples.requests_action',
    module: 'temples',
    label: 'Action on Update Requests',
    description: 'Allows approving or rejecting pending profile update requests from temples.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'temple.profile.manage',
    module: 'temples',
    label: 'Manage Temple Profile',
    description: 'Allows a temple owner or staff to update their own temple profile, gallery, and details.',
    applicableTo: [OwnerType.TEMPLE]
  },
  {
    key: 'temple.bank.manage',
    module: 'temples',
    label: 'Manage Bank Details',
    description: 'Allows managing the temple\'s bank account for receiving payouts.',
    applicableTo: [OwnerType.TEMPLE]
  },
  {
    key: 'temples.delete',
    module: 'temples',
    label: 'Delete Temple',
    description: 'Grants permission to permanently remove a temple from the platform.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── SELLERS MANAGEMENT ──────────────────────────────────
  {
    key: 'seller.profile.manage',
    module: 'sellers',
    label: 'Manage Seller Profile',
    description: 'Allows a seller owner or staff to update their own seller profile, gallery, and details.',
    applicableTo: [OwnerType.SELLER]
  },
  {
    key: 'seller.bank.manage',
    module: 'sellers',
    label: 'Manage Bank Details',
    description: 'Allows managing the seller\'s bank account for receiving payouts.',
    applicableTo: [OwnerType.SELLER]
  },

  // ── USERS (DEVOTEES) ───────────────────────────────────
  {
    key: 'users.menu',
    module: 'users',
    label: 'Show Users Menu',
    description: 'Displays the "Users" link in the sidebar to manage devotees.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'users.view',
    module: 'users',
    label: 'View Users List',
    description: 'Allows viewing the list of all registered users/devotees and their profiles.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'users.manage',
    module: 'users',
    label: 'Manage Users',
    description: 'Allows editing user status (Active/Inactive) and basic profile information.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── POOJA BOOKINGS ──────────────────────────────────────
  {
    key: 'bookings.menu',
    module: 'bookings',
    label: 'Show Bookings Menu',
    description: 'Displays the "Pooja Bookings" section in the sidebar menu.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'bookings.view',
    module: 'bookings',
    label: 'View Bookings List',
    description: 'Allows viewing all pooja booking records, customer names, and dates.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'bookings.manage',
    module: 'bookings',
    label: 'Update Booking Status',
    description: 'Allows updating booking status to Completed, Cancelled, or Fulfilled.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },

  // ── DONATIONS ───────────────────────────────────────────
  {
    key: 'donations.menu',
    module: 'donations',
    label: 'Show Donations Menu',
    description: 'Displays the "Donations" link in the sidebar.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'donations.view',
    module: 'donations',
    label: 'View Donation History',
    description: 'Allows viewing the list of all donations received across temples.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── PRODUCT MANAGEMENT ──────────────────────────────────
  {
    key: 'products.menu',
    module: 'products',
    label: 'Show Products Menu',
    description: 'Displays the "Product Management" category in the sidebar.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'products.view',
    module: 'products',
    label: 'View Product List',
    description: 'Allows viewing the table of all products across the platform.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'products.create',
    module: 'products',
    label: 'Add New Product',
    description: 'Enables the "Add Product" button and access to the product creation form.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'products.edit',
    module: 'products',
    label: 'Edit Product',
    description: 'Allows editing existing product information, pricing, and images.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'products.delete',
    module: 'products',
    label: 'Delete Product',
    description: 'Allows permanent removal of a product from the database.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'products.approval',
    module: 'products',
    label: 'Approve/Reject Products',
    description: 'Grant permission to approve or disapprove products submitted by sellers/temples.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'products.orders.view',
    module: 'products',
    label: 'View Product Orders',
    description: 'Allows viewing the list of product orders and sub-orders.',
    applicableTo: [OwnerType.ADMIN, OwnerType.SELLER]
  },
  {
    key: 'products.orders.manage',
    module: 'products',
    label: 'Manage Product Orders',
    description: 'Allows updating shipping status and order fulfillment details.',
    applicableTo: [OwnerType.ADMIN, OwnerType.SELLER]
  },

  // ── PRODUCT CATEGORIES ──────────────────────────────────
  {
    key: 'categories.view',
    module: 'categories',
    label: 'View Categories',
    description: 'Allows viewing the list of product categories.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'categories.create',
    module: 'categories',
    label: 'Add Category',
    description: 'Allows creating new product categories.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'categories.edit',
    module: 'categories',
    label: 'Edit Category',
    description: 'Allows editing category names, descriptions, and images.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'categories.delete',
    module: 'categories',
    label: 'Delete Category',
    description: 'Allows deleting product categories.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── POOJAS ──────────────────────────────────────────────
  {
    key: 'poojas.view',
    module: 'poojas',
    label: 'View Pooja List',
    description: 'Allows viewing all poojas listed in the admin/temple panel.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'poojas.create',
    module: 'poojas',
    label: 'Add New Pooja',
    description: 'Allows creating new pooja services.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'poojas.edit',
    module: 'poojas',
    label: 'Edit Pooja',
    description: 'Allows editing pooja descriptions, pricing, and process steps.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'poojas.delete',
    module: 'poojas',
    label: 'Delete Pooja',
    description: 'Allows permanent removal of a pooja service.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── EVENTS ──────────────────────────────────────────────
  {
    key: 'events.view',
    module: 'events',
    label: 'View Events List',
    description: 'Allows viewing all upcoming and past events.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'events.create',
    module: 'events',
    label: 'Add New Event',
    description: 'Allows creating new temple events/festivals.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'events.edit',
    module: 'events',
    label: 'Edit Event',
    description: 'Allows updating event schedules, descriptions, and status.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE]
  },
  {
    key: 'events.delete',
    module: 'events',
    label: 'Delete Event',
    description: 'Allows permanent removal of an event.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── CMS (CONTENT MANAGEMENT) ─────────────────────────────
  {
    key: 'cms.menu',
    module: 'cms',
    label: 'Show CMS Menu',
    description: 'Displays the "CMS" section in the sidebar for website content management.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'cms.banners',
    module: 'cms',
    label: 'Manage Home Banners',
    description: 'Allows adding, editing, or deleting banners appearing on the website homepage.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'cms.features',
    module: 'cms',
    label: 'Manage Feature Cards',
    description: 'Allows editing the promotional feature cards on the landing page.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'cms.testimonials',
    module: 'cms',
    label: 'Manage Testimonials',
    description: 'Allows management of video testimonials and customer reviews.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── FINANCE & PAYOUTS ───────────────────────────────────
  {
    key: 'finance.menu',
    module: 'finance',
    label: 'Show Finance Menu',
    description: 'Displays the "Finance & Payouts" category in the sidebar.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'finance.ledger.view',
    module: 'finance',
    label: 'View Transaction Ledger',
    description: 'Allows viewing the financial transaction records, earnings, and commissions.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'finance.withdrawals.view',
    module: 'finance',
    label: 'View Withdrawal Requests',
    description: 'Allows viewing payout requests submitted by temples or sellers.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'finance.withdrawals.action',
    module: 'finance',
    label: 'Action on Withdrawals',
    description: 'Allows approving, rejecting, or processing financial payouts to bank accounts.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── TEAM MANAGEMENT ─────────────────────────────────────
  {
    key: 'team.menu',
    module: 'team',
    label: 'Show Team Management Menu',
    description: 'Displays the "Team Management" link in the sidebar.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'team.staff.view',
    module: 'team',
    label: 'View Staff List',
    description: 'Allows viewing the list of fellow staff members and their roles.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'team.staff.manage',
    module: 'team',
    label: 'Manage Staff Members',
    description: 'Allows creating new staff, disabling accounts, and assigning roles to staff.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },
  {
    key: 'team.roles.manage',
    module: 'team',
    label: 'Manage Roles & Permissions',
    description: 'High-level permission to create, edit, or delete Roles and modify their permission sets.',
    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER]
  },

  // ── LIVE DARSHAN ────────────────────────────────────────
  {
    key: 'live_darshan.view',
    module: 'live_darshan',
    label: 'View Live Darshan',
    description: 'Allows viewing the list of live darshan streams.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'live_darshan.manage',
    module: 'live_darshan',
    label: 'Manage Live Darshan',
    description: 'Allows adding or editing live darshan links.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── SELLERS MANAGEMENT ──────────────────────────────────
  {
    key: 'sellers.view',
    module: 'sellers',
    label: 'View Sellers List',
    description: 'Allows viewing the list of registered sellers/vendors.',
    applicableTo: [OwnerType.ADMIN]
  },
  {
    key: 'sellers.manage',
    module: 'sellers',
    label: 'Manage Sellers',
    description: 'Allows editing seller status and basic information.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── SETTINGS ────────────────────────────────────────────
  {
    key: 'settings.commission',
    module: 'settings',
    label: 'Manage Commission Slabs',
    description: 'Allows editing the platform commission rates for Poojas and marketplace products.',
    applicableTo: [OwnerType.ADMIN]
  },

  // ── MARKETING ───────────────────────────────────────────
  {
    key: 'marketing.view',
    module: 'marketing',
    label: 'View Marketing Dashboard',
    description: 'Allows accessing the WhatsApp marketing dashboard and sending bulk campaigns.',
    applicableTo: [OwnerType.ADMIN]
  },
];

async function main() {
  console.log('🗑️  Deleting existing roles and permissions to avoid conflicts...');

  await prisma.rolePermission.deleteMany({});
  await prisma.staffRole.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});

  console.log('🌱 Seeding new granular permissions...');

  for (const perm of permissions) {
    await prisma.permission.create({
      data: perm,
    });
  }

  console.log(`✅ ${permissions.length} granular permissions seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
