import { PrismaClient, OwnerType } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // ── DASHBOARD ───────────────────────────────────────────
  { key: 'dashboard.view', module: 'dashboard', label: 'Show Dashboard Link', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },

  // ── TEMPLES MANAGEMENT (ADMIN SIDE) ─────────────────────
  { key: 'temples.menu',            module: 'temples', label: 'Show Temples Menu',           applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.view',            module: 'temples', label: 'View Temples List',          applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.create',          module: 'temples', label: 'Add New Temple',             applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.edit',            module: 'temples', label: 'Edit Temple Details',        applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.verify',          module: 'temples', label: 'Approve/Reject Verification', applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.delete',          module: 'temples', label: 'Delete Temple',               applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.requests_view',   module: 'temples', label: 'View Update Requests',        applicableTo: [OwnerType.ADMIN] },
  { key: 'temples.requests_action', module: 'temples', label: 'Action on Update Requests',   applicableTo: [OwnerType.ADMIN] },

  // ── MANDALS MANAGEMENT ───────────────────────────────────
  { key: 'mandals.menu',   module: 'mandals', label: 'Show Mandals Menu',   applicableTo: [OwnerType.ADMIN, OwnerType.MANDAL] },
  { key: 'mandals.view',   module: 'mandals', label: 'View Mandals List',   applicableTo: [OwnerType.ADMIN, OwnerType.MANDAL] },
  { key: 'mandals.create', module: 'mandals', label: 'Add New Mandal',     applicableTo: [OwnerType.ADMIN] },
  { key: 'mandals.edit',   module: 'mandals', label: 'Edit Mandal Details', applicableTo: [OwnerType.ADMIN, OwnerType.MANDAL] },
  { key: 'mandals.delete', module: 'mandals', label: 'Delete Mandal',       applicableTo: [OwnerType.ADMIN] },
  { key: 'mandals.manage', module: 'mandals', label: 'Manage Mandals Status', applicableTo: [OwnerType.ADMIN] },
  { key: 'mandals.news',        module: 'mandals', label: 'View Mandal News',        applicableTo: [OwnerType.ADMIN, OwnerType.MANDAL] },
  { key: 'mandals.news.create', module: 'mandals', label: 'Create Mandal News Post', applicableTo: [OwnerType.ADMIN, OwnerType.MANDAL] },
  { key: 'mandals.news.edit',   module: 'mandals', label: 'Edit Mandal News Post',   applicableTo: [OwnerType.ADMIN, OwnerType.MANDAL] },
  { key: 'mandals.news.delete', module: 'mandals', label: 'Delete Mandal News Post', applicableTo: [OwnerType.ADMIN, OwnerType.MANDAL] },

  // ── LEADS MANAGEMENT ─────────────────────────────────────
  { key: 'leads.menu',   module: 'leads', label: 'Show Leads Menu',       applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'leads.view',   module: 'leads', label: 'View Offline Leads',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'leads.manage', module: 'leads', label: 'Manage & Assign Leads', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'leads.export', module: 'leads', label: 'Export Leads Data',     applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── DARSHAN MANAGEMENT ───────────────────────────────────
  { key: 'darshan.menu',   module: 'darshan', label: 'Show Darshan Menu', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'darshan.view',   module: 'darshan', label: 'View Darshan Tickets', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'darshan.create', module: 'darshan', label: 'Create Darshan Booking', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'darshan.edit',   module: 'darshan', label: 'Edit Darshan Slot/Ticket', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'darshan.delete', module: 'darshan', label: 'Cancel Darshan Ticket', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'darshan.slots',  module: 'darshan', label: 'Manage Darshan Timings/Slots', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'darshan.scan',   module: 'darshan', label: 'Scan QR at Gate for Entry', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── PHOTOGRAPHY SERVICES (TEMPLE) ────────────────────────
  { key: 'photography.menu',     module: 'photography', label: 'Show Photography Menu', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'photography.view',     module: 'photography', label: 'View Photography Packages', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'photography.create',   module: 'photography', label: 'Add Photography Package', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'photography.edit',     module: 'photography', label: 'Edit Photography Package', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'photography.delete',   module: 'photography', label: 'Delete Photography Package', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'photography.bookings', module: 'photography', label: 'View & Manage Photo Bookings', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },

  // ── PAID PRASAD SERVICES (TEMPLE) ───────────────────────
  { key: 'prasad.menu',   module: 'prasad', label: 'Show Paid Prasad Menu', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'prasad.view',   module: 'prasad', label: 'View Paid Prasad List', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'prasad.create', module: 'prasad', label: 'Add New Paid Prasad Item', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'prasad.edit',   module: 'prasad', label: 'Edit Paid Prasad Item', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },
  { key: 'prasad.delete', module: 'prasad', label: 'Delete Paid Prasad Item', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE] },

  // ── MANDAL SPECIFIC (OWNER SIDE) ────────────────────────
  { key: 'mandal.profile.manage', module: 'mandals', label: 'Manage Mandal Profile', applicableTo: [OwnerType.MANDAL] },
  { key: 'mandal.bank.manage',    module: 'mandals', label: 'Manage Bank Details',   applicableTo: [OwnerType.MANDAL] },

  // ── TEMPLE SPECIFIC (OWNER SIDE) ────────────────────────
  { key: 'temple.profile.manage', module: 'temples', label: 'Manage Temple Profile', applicableTo: [OwnerType.TEMPLE] },
  { key: 'temple.bank.manage',    module: 'temples', label: 'Manage Bank Details',    applicableTo: [OwnerType.TEMPLE] },

  // ── SELLERS MANAGEMENT (ADMIN SIDE) ─────────────────────
  { key: 'sellers.view',   module: 'sellers', label: 'View Sellers List', applicableTo: [OwnerType.ADMIN] },
  { key: 'sellers.manage', module: 'sellers', label: 'Manage Sellers',     applicableTo: [OwnerType.ADMIN] },

  // ── SELLER SPECIFIC (OWNER SIDE) ────────────────────────
  { key: 'seller.profile.manage', module: 'sellers', label: 'Manage Seller Profile', applicableTo: [OwnerType.SELLER] },
  { key: 'seller.bank.manage',    module: 'sellers', label: 'Manage Bank Details',   applicableTo: [OwnerType.SELLER] },

  // ── TELLER MODULE (POS) ──────────────────────────────────
  { key: 'teller.menu',   module: 'teller', label: 'Show Teller Module Menu',   applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'teller.view',   module: 'teller', label: 'View Teller Counter & Cart',applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'teller.create', module: 'teller', label: 'Create Offline POS Bookings',applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'teller.edit',   module: 'teller', label: 'Edit Teller Transactions',  applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'teller.delete', module: 'teller', label: 'Delete Teller Transactions',applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── ORDER MANAGEMENT ─────────────────────────────────────
  { key: 'orders.menu',   module: 'orders', label: 'Show Order Management Menu', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'orders.view',   module: 'orders', label: 'View Product Orders List',   applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'orders.create', module: 'orders', label: 'Create Manual / Store Order', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'orders.edit',   module: 'orders', label: 'Update Order Fulfillment Status', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'orders.delete', module: 'orders', label: 'Cancel / Delete Product Order', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },

  // ── BANK DETAILS ─────────────────────────────────────────
  { key: 'bank.view',   module: 'bank', label: 'View Bank Account Details', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'bank.manage', module: 'bank', label: 'Add / Edit Bank Account Details', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },

  // ── COLLECTION REPORTS ──────────────────────────────────
  { key: 'reports.view', module: 'reports', label: 'View Collection Reports & Daily Summary', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── AARTI TIMINGS ───────────────────────────────────────
  { key: 'aarti.view',   module: 'aarti', label: 'View Aarti Schedule', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'aarti.manage', module: 'aarti', label: 'Add, Edit & Toggle Active Aarti Timings', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── USERS (DEVOTEES) ───────────────────────────────────
  { key: 'users.menu',   module: 'users', label: 'Show Devotees Menu',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'users.view',   module: 'users', label: 'View Devotees List',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'users.create', module: 'users', label: 'Add New Devotee Profile', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'users.edit',   module: 'users', label: 'Edit Devotee Details', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'users.delete', module: 'users', label: 'Delete / Remove Devotee', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'users.manage', module: 'users', label: 'Manage Users Status', applicableTo: [OwnerType.ADMIN] },

  // ── POOJA BOOKINGS ──────────────────────────────────────
  { key: 'bookings.menu',   module: 'bookings', label: 'Show Bookings Menu',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'bookings.view',   module: 'bookings', label: 'View Bookings List',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'bookings.manage', module: 'bookings', label: 'Update Booking Status', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── DONATIONS ───────────────────────────────────────────
  { key: 'donations.menu', module: 'donations', label: 'Show Donations Menu',  applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'donations.view', module: 'donations', label: 'View Donation History', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── PRODUCT MANAGEMENT ──────────────────────────────────
  { key: 'products.menu',     module: 'products', label: 'Show Products Menu',   applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'products.view',     module: 'products', label: 'View Product List',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'products.create',   module: 'products', label: 'Add New Product',      applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'products.edit',     module: 'products', label: 'Edit Product',         applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'products.delete',   module: 'products', label: 'Delete Product',       applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'products.approval', module: 'products', label: 'Approve/Reject Products', applicableTo: [OwnerType.ADMIN] },
  
  { key: 'categories.view',   module: 'categories', label: 'View Categories',   applicableTo: [OwnerType.ADMIN] },
  { key: 'categories.manage', module: 'categories', label: 'Manage Categories', applicableTo: [OwnerType.ADMIN] },

  { key: 'products.orders.view',   module: 'products', label: 'View Product Orders',   applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'products.orders.manage', module: 'products', label: 'Manage Product Orders', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },

  // ── POOJAS ──────────────────────────────────────────────
  { key: 'poojas.view',       module: 'poojas', label: 'View Pooja List',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'poojas.create',     module: 'poojas', label: 'Add New Pooja',      applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'poojas.edit',       module: 'poojas', label: 'Edit Pooja',         applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'poojas.delete',     module: 'poojas', label: 'Delete Pooja',       applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'poojas.categories', module: 'poojas', label: 'Manage Pooja Purposes', applicableTo: [OwnerType.ADMIN] },
  { key: 'poojas.promote',    module: 'poojas', label: 'Promote to Master',   applicableTo: [OwnerType.ADMIN] },

  // ── EVENTS ──────────────────────────────────────────────
  { key: 'events.view',   module: 'events', label: 'View Events List', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'events.create', module: 'events', label: 'Add New Event',   applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'events.edit',   module: 'events', label: 'Edit Event',      applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'events.delete', module: 'events', label: 'Delete Event',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── CMS (CONTENT MANAGEMENT) ─────────────────────────────
  { key: 'cms.menu',         module: 'cms', label: 'Show CMS Menu',           applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.banners',      module: 'cms', label: 'Manage Home Banners',     applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.features',     module: 'cms', label: 'Manage Standard Content',  applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.testimonials', module: 'cms', label: 'Manage Testimonials',     applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.faqs',         module: 'cms', label: 'Manage Pooja FAQs',       applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.ratings',      module: 'cms', label: 'Manage Global Ratings',    applicableTo: [OwnerType.ADMIN] },
  { key: 'cms.cta_cards',    module: 'cms', label: 'Manage CTA Cards',        applicableTo: [OwnerType.ADMIN] },

  // ── FINANCE & PAYOUTS ───────────────────────────────────
  { key: 'finance.menu',               module: 'finance', label: 'Show Finance Menu',         applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'finance.ledger.view',        module: 'finance', label: 'View Transaction Ledger',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'finance.withdrawals.view',   module: 'finance', label: 'View Withdrawal Requests',  applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'finance.withdrawals.action', module: 'finance', label: 'Process Financial Payouts', applicableTo: [OwnerType.ADMIN] },

  // ── TEAM MANAGEMENT ─────────────────────────────────────
  { key: 'team.menu',           module: 'team', label: 'Show Team Menu',          applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'team.staff.view',     module: 'team', label: 'View Staff Members',      applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'team.staff.manage',   module: 'team', label: 'Manage Staff Members',    applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },
  { key: 'team.roles.manage',   module: 'team', label: 'Manage Roles/Permissions', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.SELLER, OwnerType.MANDAL] },

  // ── LIVE DARSHAN ────────────────────────────────────────
  { key: 'live_darshan.view',   module: 'live_darshan', label: 'View Live List',   applicableTo: [OwnerType.ADMIN] },
  { key: 'live_darshan.manage', module: 'live_darshan', label: 'Manage Live Links', applicableTo: [OwnerType.ADMIN] },

  // ── GALLERY MANAGEMENT ─────────────────────────────────────
  { key: 'gallery.menu',   module: 'gallery', label: 'Show Gallery Menu', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'gallery.view',   module: 'gallery', label: 'View Photo/Video Gallery', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'gallery.upload', module: 'gallery', label: 'Upload Gallery Photos/Videos', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'gallery.delete', module: 'gallery', label: 'Delete Gallery Photos/Videos', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── EXPENSE MANAGEMENT ────────────────────────────────────
  { key: 'expenses.menu',            module: 'expenses', label: 'Show Expenses Menu', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'expenses.view',            module: 'expenses', label: 'View Expenses & Stats', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'expenses.create',          module: 'expenses', label: 'Record New Expense', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'expenses.edit',            module: 'expenses', label: 'Edit Expense Entry', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'expenses.delete',          module: 'expenses', label: 'Delete Expense Entry', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'expenses.categories.view', module: 'expenses', label: 'View Expense Categories', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },
  { key: 'expenses.categories.manage', module: 'expenses', label: 'Manage Expense Categories', applicableTo: [OwnerType.ADMIN, OwnerType.TEMPLE, OwnerType.MANDAL] },

  // ── SETTINGS ────────────────────────────────────────────
  { key: 'settings.commission', module: 'settings', label: 'Manage Commissions', applicableTo: [OwnerType.ADMIN] },
];

async function main() {
  console.log('🔄 Upserting all permissions into database...');

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        label: perm.label,
        module: perm.module,
        applicableTo: perm.applicableTo,
      },
      create: perm,
    });
  }

  console.log(`✅ ${permissions.length} granular permissions synced successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
