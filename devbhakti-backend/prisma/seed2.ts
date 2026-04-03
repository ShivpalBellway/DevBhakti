import { PrismaClient, UserRole, BookingStatus, SlabType, CommissionCategory, LedgerStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data
  await prisma.commissionSlab.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.templeLedger.deleteMany();
  await prisma.templeUpdateRequest.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.poojaBooking.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.subOrder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.pooja.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.temple.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleaned up existing data');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 2. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'DevBhakti Admin',
      email: 'admin@devbhakti.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  // 3. Create 6 Temples
  const templesData = [
    { name: 'Kashi Vishwanath Temple', location: 'Varanasi', email: 'kashi@temple.com' },
    { name: 'Kedarnath Temple', location: 'Uttarakhand', email: 'kedar@temple.com' },
    { name: 'Somnath Temple', location: 'Gujarat', email: 'somnath@temple.com' },
    { name: 'Badrinath Temple', location: 'Uttarakhand', email: 'badri@temple.com' },
    { name: 'Meenakshi Temple', location: 'Madurai', email: 'meenakshi@temple.com' },
    { name: 'Jagannath Temple', location: 'Puri', email: 'puri@temple.com' },
  ];

  const createdTemples = [];
  for (const t of templesData) {
    const user = await prisma.user.create({
      data: {
        name: `${t.name} Institution`,
        email: t.email,
        password: hashedPassword,
        role: UserRole.INSTITUTION,
        isVerified: true,
      }
    });

    const temple = await prisma.temple.create({
      data: {
        name: t.name,
        location: t.location,
        description: `Experience the divine grace at ${t.name}. One of the most sacred spiritual destinations.`,
        category: 'Ancient Temple',
        openTime: '5:00 AM - 10:00 PM',
        userId: user.id,
        isLive: true,
        isActive: true,
      }
    });
    createdTemples.push(temple);
  }

  // 4. Create 3 Sellers
  const sellersData = [
    { name: 'Organic Puja Store', email: 'organic@store.com' },
    { name: 'Artisan Murti Kendra', email: 'artisan@store.com' },
    { name: 'Divine Fragrances', email: 'fragrance@store.com' },
  ];

  const createdSellers = [];
  for (const s of sellersData) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: hashedPassword,
        role: UserRole.SELLER,
        isVerified: true,
      }
    });

    const seller = await prisma.sellerProfile.create({
      data: {
        name: s.name,
        location: 'Inland Distribution',
        description: `Premium spiritual products from ${s.name}.`,
        userId: user.id,
        isActive: true,
        isVerified: true,
      }
    });
    createdSellers.push(seller);
  }

  console.log('👤 Admin, Temples, and Sellers created');

  // 5. Create 6 Master Poojas
  const masterPoojasData = [
    { name: 'Maha Rudrabhishek', category: 'Mahadev Special', price: 2101, duration: '60 mins' },
    { name: 'Ganga Aarti Participation', category: 'Aarti', price: 501, duration: '30 mins' },
    { name: 'Maha Mrityunjaya Jaap', category: 'Healing', price: 5100, duration: '3 hours' },
    { name: 'Shringar Pooja', category: 'Deity Decor', price: 1100, duration: '45 mins' },
    { name: 'Sahasranama Archana', category: 'Archana', price: 251, duration: '20 mins' },
    { name: 'Janmotsav Special Pooja', category: 'Birthday', price: 1501, duration: '60 mins' },
  ];

  const createdMasterPoojas = [];
  for (const mp of masterPoojasData) {
    const pooja = await prisma.pooja.create({
      data: {
        ...mp,
        description: [`Special ${mp.name} for spiritual upliftment.`],
        time: 'Morning/Evening',
        isMaster: true,
        about: `Perform ${mp.name} to receive blessings and peace.`,
        benefits: ['Peace of mind', 'Spiritual growth', 'Health and prosperity'],
        bullets: ['Vedic Priests', 'Samagri Included', 'Digital Receipt'],
        status: true,
      }
    });
    createdMasterPoojas.push(pooja);
  }

  // 6. Create Temple Specific Copies (Templates in action)
  for (let i = 0; i < 3; i++) {
    const master = createdMasterPoojas[i];
    const temple = createdTemples[i];
    
    await prisma.pooja.create({
      data: {
        name: master.name,
        category: master.category,
        price: master.price + 100, // Custom temple price
        duration: master.duration,
        description: master.description as string[],
        time: master.time,
        isMaster: false,
        masterPoojaId: master.id,
        templeId: temple.id,
        about: master.about,
        benefits: master.benefits as string[],
        bullets: master.bullets as string[],
        status: true,
      }
    });
  }

  console.log('🙏 Master Poojas and Temple Copies created');

  // 7. Create Product Category
  const pujaEss = await prisma.productCategory.create({
    data: { name: 'Puja Essentials', description: 'Essential items for your daily puja.' }
  });

  // 8. Create Products for different entities
  // 8a. Admin Products
  await prisma.product.create({
    data: {
      name: 'Premium Puja Thali (DevBhakti Exclusive)',
      description: 'Brass thali with all essential items.',
      category: 'Puja Essentials',
      categoryId: pujaEss.id,
      status: 'approved',
      variants: { create: [{ name: 'Standard', price: 1500, stock: 100 }] }
    }
  });

  // 8b. Temple Products
  await prisma.product.create({
    data: {
      name: 'Holy Ganges Water (Varanasi)',
      description: 'Sacred water from the heart of Kashi.',
      category: 'Puja Essentials',
      categoryId: pujaEss.id,
      templeId: createdTemples[0].id,
      status: 'approved',
      variants: { create: [{ name: '500ml', price: 150, stock: 500 }] }
    }
  });

  // 8c. Seller Products
  await prisma.product.create({
    data: {
      name: 'Organic Sandalwood Powder',
      description: '100% pure organic sandalwood.',
      category: 'Puja Essentials',
      categoryId: pujaEss.id,
      sellerId: createdSellers[0].id,
      status: 'approved',
      variants: { create: [{ name: '100g', price: 450, stock: 200 }] }
    }
  });

  console.log('🛒 Products (Admin, Temple, Seller) created');

  // 9. Commission Slabs (New System Demo)
  await prisma.commissionSlab.createMany({
    data: [
      // GLOBAL slabs for Marketplace (fallback)
      { minAmount: 0, maxAmount: 1000, percentage: 10, slabType: SlabType.GLOBAL, category: CommissionCategory.MARKETPLACE },
      { minAmount: 1000, maxAmount: null, percentage: 8, slabType: SlabType.GLOBAL, category: CommissionCategory.MARKETPLACE },
      
      // GLOBAL slabs for Pooja (DevBhakti's platform fee for services)
      { minAmount: 0, maxAmount: 2000, percentage: 15, slabType: SlabType.GLOBAL, category: CommissionCategory.POOJA },
      { minAmount: 2000, maxAmount: null, percentage: 12, slabType: SlabType.GLOBAL, category: CommissionCategory.POOJA },
    ]
  });

  console.log('📈 Commission Slabs created');
  console.log('✅ Seeding completed! Use: admin@devbhakti.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
