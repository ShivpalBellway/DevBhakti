import { PrismaClient, UserRole, SlabType, CommissionCategory } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with real Mumbai temples...');

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
  await prisma.user.create({
    data: {
      name: 'DevBhakti Admin',
      email: 'admin@devbhakti.com',
      password: hashedPassword,
      phone: '9876543210',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  // 3. Create Real Temples Data
  const templesData = [
    {
      name: 'Shree Udyan Ganesh Mandir',
      category: 'Ganesh',
      location: 'Mumbai, Maharashtra',
      phone: '7788994455',
      email: 'shreeudhyan@gmail.com',
      address: 'Veer Savarkar Marg, Shivaji Park Ground, Dadar West, Mumbai, Maharashtra – 400028, India',
      history: 'The origins of Shree Udyan Ganesh Mandir date back to 1963, when the idol of Lord Ganesh was discovered beneath a banyan tree at Shivaji Park. As devotion grew among local residents, the temple was officially established on 1 March 1970. Today, it stands as a respected spiritual and cultural landmark in the Shivaji Park area.',
      about: 'Shree Udyan Ganesh Mandir enshrines a sacred idol of Lord Ganesh with a right-turned trunk, flanked by the idols of Riddhi and Siddhi. The temple is known for its peaceful environment, strong community bond, and regular participation in religious, social, and charitable activities.',
      bullets: ['Right-trunked Ganesh idol', 'Peaceful garden-side location', 'Major Ganesh Chaturthi celebrations', 'Active involvement in social welfare']
    },
    {
      name: 'Kashi Vishveshwar Mandir',
      category: 'Shiva',
      location: 'Mumbai, Maharashtra',
      phone: '8899445566',
      email: 'kashivishveswar@gmail.com',
      address: 'Takandas Kataria Marg, Lokmanya Nagar, Joshi Vadi, Matunga East, Mumbai, Maharashtra – 400016, India',
      history: 'Kashi Vishveshwar Mandir is a longstanding Shiva temple in Matunga East, known for its peaceful atmosphere and traditional worship practices. Devotees often visit especially during Mahashivratri and other major Hindu festivals.',
      about: 'The temple is dedicated to Lord Shiva, worshiped locally as Vishveshwar — “Lord of the Universe.” It serves as a calm spiritual space within the busy Matunga area, where devotees regularly offer prayers and perform rituals.',
      bullets: ['Traditional Shiva temple in Mumbai', 'Regular poojas and Shivaratri celebrations', 'Serene place for daily worship', 'Popular local spiritual landmark']
    },
    {
      name: 'Sitladevi Temple',
      category: 'Hindu temple',
      location: 'Mumbai, Maharashtra',
      phone: '9823144789',
      email: 'sitladevimandir@gmail.com',
      address: 'Sitladevi Temple Rd, Mahim, Mumbai, Maharashtra 400016, India',
      history: 'Sitladevi Temple in Mahim is a revered local place of worship and heritage shrine serving the community for many decades. Dedicated to Goddess Sitladevi — the deity associated with health and protection.',
      about: 'The temple is dedicated to Goddess Sitladevi (also called Shitladevi), a manifestation of the Mother Goddess. Sitladevi is traditionally worshipped as a protector against disease and hardship.',
      bullets: ['Traditional Hindu temple with local devotion', 'Dedicated to Goddess Sitladevi', 'Frequent visits and rituals during festivals', 'Serene place for prayer and spiritual reflection']
    },
    {
      name: 'Ganpatipule Temple',
      category: 'Hindu Temple',
      location: 'Ganpatipule, Ratnagiri',
      phone: '9012345678',
      email: 'info@ganpatipulemandir.org',
      address: 'Ganpatipule, Ratnagiri, Maharashtra 415622, India',
      history: 'Ganpatipule Temple is a historic shrine dedicated to Lord Ganesha, believed to be a Swayambhu (self-manifested) idol that emerged from the earth centuries ago.',
      about: 'The temple enshrines a majestic idol of Lord Ganesha facing west toward the Arabian Sea, symbolizing divine protection from the western direction.',
      bullets: ['Ancient Swayambhu Ganesh idol with coastal significance', 'Considered one of the eight important Ganesh temples in India', 'Picturesque location by the Arabian Sea', 'Pradakshina path around the hill for devotees']
    },
    {
      name: 'Ballaleshwar Mandir, Pali',
      category: 'Hindu Temple (Ashtavinayak Shrine)',
      location: 'Pali, Raigad',
      phone: '9876543210',
      email: 'contact@ballaleshwarpali.org',
      address: 'Taluka Sudhagad, District Raigad, Pali, Maharashtra 410205, India',
      history: 'Ballaleshwar Mandir at Pali is one of the sacred Ashtavinayak temples dedicated to Lord Ganesha and is unique because it is named after a devotee, Ballal.',
      about: 'The temple enshrines Lord Ganapati with his trunk turned left, seated on a stone throne flanked by Siddhi and Riddhi. Built in the shape of the sacred syllable “Shri”.',
      bullets: ['One of the Eight Ashtavinayak temples of Lord Ganesha', 'Only temple named after a devotee (Ballal)', 'East-facing idol with diamond embellishments', 'Traditional festivals celebrated with great fervour']
    },
    {
      name: 'Ambabai Mandir (Mahalaxmi Temple)',
      category: 'Hindu Temple (Shakti Peetha)',
      location: 'Kolhapur, Maharashtra',
      phone: '9876543211',
      email: 'info@ambabaikolhapur.org',
      address: 'Shree Ambabai (Mahalaxmi) Temple, Mahadwar Road, B Ward, Kolhapur, Maharashtra 416012, India',
      history: 'Ambabai Mandir, commonly known as the Mahalaxmi Temple of Kolhapur, dates back to the 7th century CE, originally established under the Chalukya dynasty.',
      about: 'The temple is dedicated to Goddess Mahalaxmi (Ambabai), revered as a powerful form of the Mother Goddess associated with wealth, prosperity, and spiritual power.',
      bullets: ['Significant Shakti Peetha and pilgrimage temple', 'Dates back to the 7th century CE', 'Dedicated to Goddess Mahalaxmi (Ambabai)', 'Intricate Hemadpanti stone architecture']
    }
  ];

  for (const t of templesData) {
    const user = await prisma.user.create({
      data: {
        name: `${t.name} Admin`,
        email: t.email,
        password: hashedPassword,
        phone: t.phone,
        role: UserRole.INSTITUTION,
        isVerified: true,
      }
    });

    await prisma.temple.create({
      data: {
        name: t.name,
        location: t.location,
        fullAddress: t.address,
        description: t.about,
        history: t.history,
        category: t.category,
        openTime: '6:00 AM - 9:00 PM',
        userId: user.id,
        isLive: true,
        isActive: true,
        phone: t.phone,
        website: `https://www.${t.name.toLowerCase().replace(/ /g, '')}.com`
      }
    });
  }

  // 4. Create 3 Sellers
  const sellersData = [
    { name: 'Divine Agarbatti Store', email: 'seller1@devbhakti.com', phone: '9988776655' },
    { name: 'Pure Ghee & Samagri', email: 'seller2@devbhakti.com', phone: '9988776644' },
    { name: 'Vedic Murti Arts', email: 'seller3@devbhakti.com', phone: '9988776633' },
  ];

  for (const s of sellersData) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: hashedPassword,
        phone: s.phone,
        role: UserRole.SELLER,
        isVerified: true,
      }
    });

    await prisma.sellerProfile.create({
      data: {
        name: s.name,
        location: 'Mumbai Hub',
        description: `Premium spiritual products from ${s.name}.`,
        userId: user.id,
        isActive: true,
        isVerified: true,
        phone: s.phone
      }
    });
  }

  // 5. Create basic Product Categories
  const categories = [
    { name: 'Puja Essentials', description: 'Daily puja items' },
    { name: 'Murti & Idols', description: 'Beautifully crafted idols' },
    { name: 'Incense & Fragrance', description: 'Agarbatti and Dhoop' }
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const createdCat = await prisma.productCategory.create({
      data: cat
    });
    createdCategories.push(createdCat);
  }

  // 6. Commission Slabs
  await prisma.commissionSlab.createMany({
    data: [
      { minAmount: 0, maxAmount: 1000, percentage: 10, slabType: SlabType.GLOBAL, category: CommissionCategory.MARKETPLACE },
      { minAmount: 1000, maxAmount: null, percentage: 8, slabType: SlabType.GLOBAL, category: CommissionCategory.MARKETPLACE },
      { minAmount: 0, maxAmount: 2000, percentage: 15, slabType: SlabType.GLOBAL, category: CommissionCategory.POOJA },
      { minAmount: 2000, maxAmount: null, percentage: 12, slabType: SlabType.GLOBAL, category: CommissionCategory.POOJA },
    ]
  });

  console.log('✅ Seeding completed successfully!');
  console.log('🔑 Login Details:');
  console.log('   - Admin: admin@devbhakti.com / admin123');
  console.log('   - Temple (Udyan Ganesh): shreeudhyan@gmail.com / admin123');
  console.log('   - Seller (Agarbatti): seller1@devbhakti.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
