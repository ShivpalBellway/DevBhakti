import { PrismaClient, UserRole, BookingStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data (in reverse order of dependencies)
  await prisma.withdrawalRequest.deleteMany();
  await prisma.templeLedger.deleteMany();
  await prisma.templeUpdateRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.poojaBooking.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.subOrder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.pooja.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.temple.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleaned up existing data');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@devbhakti.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const templeUser1 = await prisma.user.create({
    data: {
      name: 'Kashi Vishwanath Institution',
      email: 'kashi@temple.com',
      password: hashedPassword,
      role: UserRole.INSTITUTION,
      isVerified: true,
    },
  });

  const templeUser2 = await prisma.user.create({
    data: {
      name: 'Kedarnath Trust',
      email: 'kedarnath@temple.com',
      password: hashedPassword,
      role: UserRole.INSTITUTION,
      isVerified: true,
    },
  });

  const sellerUser = await prisma.user.create({
    data: {
      name: 'Devotional Store',
      email: 'store@devbhakti.com',
      password: hashedPassword,
      role: UserRole.SELLER,
      isVerified: true,
    },
  });

  const devotee = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: hashedPassword,
      role: UserRole.DEVOTEE,
      isVerified: true,
      phone: '9876543210'
    },
  });

  console.log('👤 Users created');

  // 2.1 Create Banners
  await prisma.banner.createMany({
    data: [
      {
        image: 'https://images.unsplash.com/photo-1544161515-4af6b1d8d159?w=1200&q=80',
        link: '/pooja/rudrabhishek',
        active: true,
        order: 1,
      },
      {
        image: 'https://images.unsplash.com/photo-1590050752117-23a9d7fc2140?w=1200&q=80',
        link: '/temple/kashi-vishwanath',
        active: true,
        order: 2,
      },
      {
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
        link: '/products',
        active: true,
        order: 3,
      }
    ]
  });

  console.log('🖼️  Banners created');

  // 3. Create Temples
  const temple1 = await prisma.temple.create({
    data: {
      name: 'Kashi Vishwanath Temple',
      location: 'Varanasi, Uttar Pradesh',
      fullAddress: 'Lahori Tola, Varanasi, Uttar Pradesh 221001',
      description: 'The Kashi Vishwanath Temple is one of the most famous Hindu temples dedicated to Lord Shiva.',
      history: 'The temple has been destroyed and reconstructed several times in history. The current structure was built by Ahilyabai Holkar of Indore in 1780.',
      category: 'Jyotirlinga',
      openTime: '4:00 AM - 11:00 PM',
      rating: 4.9,
      reviewsCount: 1500,
      userId: templeUser1.id,
      image: 'https://images.unsplash.com/photo-1624638766050-70529402636f?w=800&q=80',
      heroImages: [
        'https://images.unsplash.com/photo-1624638766050-70529402636f?w=1200',
        'https://images.unsplash.com/photo-1590050752117-23a9d7fc2140?w=1200'
      ],
      poojaCommissionRate: 5.0,
      productCommissionRate: 10.0,
    },
  });

  const temple2 = await prisma.temple.create({
    data: {
      name: 'Kedarnath Temple',
      location: 'Rudraprayag, Uttarakhand',
      fullAddress: 'Kedarnath, Uttarakhand 246445',
      description: 'Kedarnath Temple is a Hindu temple dedicated to Lord Shiva, located on the Garhwal Himalayan range near the Mandakini river.',
      history: 'According to Hindu legends, the temple was initially built by Pandavas, and is one of the twelve Jyotirlingas.',
      category: 'Jyotirlinga',
      openTime: '6:00 AM - 9:00 PM',
      rating: 4.9,
      reviewsCount: 1200,
      userId: templeUser2.id,
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
      heroImages: [
        'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200'
      ],
      poojaCommissionRate: 5.0,
      productCommissionRate: 10.0,
    },
  });

  console.log('🛕 Temples created');

  // 4. Create Events
  await prisma.event.createMany({
    data: [
      {
        name: 'Maha Shivratri Celebration',
        date: '2026-02-26',
        description: 'Grand celebration of Maha Shivratri with overnight prayers and rituals.',
        templeId: temple1.id,
      },
      {
        name: 'Ganga Aarti',
        date: 'Daily',
        description: 'Special evening ritual performed on the banks of the Ganges.',
        templeId: temple1.id,
      },
      {
        name: 'Kedarnath Opening Ceremony',
        date: '2026-05-10',
        description: 'Traditional ceremony marking the opening of the temple doors for devotees.',
        templeId: temple2.id,
      },
    ],
  });

  console.log('📅 Events created');

  // 5. Create Poojas
  const poojas = [
    {
      name: 'Rudrabhishek Pooja',
      category: 'Special Pooja',
      price: 2100,
      duration: '45-60 mins',
      description: ['A powerful ritual of bathing the Shiva Lingam with various offerings.'],
      time: '6:00 AM',
      image: 'https://images.unsplash.com/photo-1541093126081-3069154b0366?w=800',
      about: 'Rudrabhishek is a ritual where a Panchamrut is offered to Lord Shiva along with many other precious items.',
      benefits: ['Spiritual growth', 'Removal of obstacles', 'Peace and prosperity'],
      bullets: ['Live streaming available', 'Prasad will be sent via couriers', 'Personalized Sankalpa'],
      templeId: temple1.id,
      packages: [
        { name: 'Standard', price: 2100, description: 'Single devotee Rudrabhishek' },
        { name: 'Family', price: 5100, description: 'Rudrabhishek for the whole family' }
      ],
    },
    {
      name: 'Maha Mrityunjaya Jaap',
      category: 'Healing Pooja',
      price: 5000,
      duration: '3 hours',
      description: ['A sacred chant for longevity and overcoming fear of death.'],
      time: '5:00 AM',
      image: 'https://images.unsplash.com/photo-1561007011-2834fa39556d?w=800',
      templeId: temple1.id,
      packages: [
        { name: '1.25 Lakh Jaap', price: 11000, description: 'Intensive chanting by 5 priests' }
      ],
    },
    {
      name: 'Special Ganga Aarti',
      category: 'Aarti',
      price: 1100,
      duration: '30 mins',
      description: ['A personalized participation in the grand evening aarti at Dashashwamedh Ghat.'],
      time: '6:30 PM',
      image: 'https://images.unsplash.com/photo-1590050752117-23a9d7fc2140?w=800',
      templeId: temple1.id,
      packages: [
        { name: 'Single', price: 1100, description: 'Single person participation' },
        { name: 'Couple', price: 2100, description: 'Couple participation' }
      ],
    },
    {
      name: 'Kedarnath Shringar Pooja',
      category: 'Special Pooja',
      price: 3500,
      duration: '60 mins',
      description: ['A special ritual focused on the decoration of the deity with flowers and sandalwood.'],
      time: '7:00 AM',
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
      about: 'The Shringar pooja at Kedarnath is one of the most aesthetic and spiritually uplifting rituals.',
      benefits: ['Aesthetic satisfaction', 'Spiritual peace', 'Closeness to the divine'],
      bullets: ['Fresh flowers used', 'Priest-led ritual', 'Digital certificate included'],
      templeId: temple2.id,
      packages: [
        { name: 'Standard', price: 3500, description: 'Basic decoration pooja' },
        { name: 'Grand', price: 7500, description: 'Extensive decoration with special herbs' }
      ],
    },
    {
      name: 'Akhand Jyoti Deepam',
      category: 'Daily Ritual',
      price: 501,
      duration: 'Continuous',
      description: ['Lighting an eternal lamp in your name for 24 hours.'],
      time: 'Anytime',
      image: 'https://images.unsplash.com/photo-1594142142270-496359f5187e?w=800',
      templeId: temple2.id,
      packages: [
        { name: '1 Day', price: 501, description: '24 hours lamp' },
        { name: '7 Days', price: 2100, description: '1 week eternal lamp' }
      ],
    },
    {
      name: 'Shiva Sahasranama Archana',
      category: 'Archana',
      price: 501,
      duration: '30 mins',
      description: ['Recitation of 1000 names of Lord Shiva.'],
      time: '8:00 AM',
      image: 'https://images.unsplash.com/photo-1541093126081-3069154b0366?w=800',
      templeId: temple2.id,
      packages: [
        { name: 'Standard', price: 501, description: 'Single archana' }
      ],
    }
  ];

  const createdPoojas = [];
  for (const p of poojas) {
    const cp = await prisma.pooja.create({ data: p });
    createdPoojas.push(cp);
  }

  console.log('🙏 Poojas created');

  // 6. Create Product Categories
  const cat1 = await prisma.productCategory.create({
    data: {
      name: 'Statues & Idols',
      description: 'Beautifully crafted divine idols for your home temple.',
      image: 'https://images.unsplash.com/photo-1582234052309-8f0a0e5b0e5b?w=400',
    },
  });

  const cat2 = await prisma.productCategory.create({
    data: {
      name: 'Incense & Fragrances',
      description: 'Organic and traditional incense sticks and dhoop.',
      image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400',
    },
  });

  const cat3 = await prisma.productCategory.create({
    data: {
      name: 'Puja Essentials',
      description: 'Everything you need for your daily rituals.',
      image: 'https://images.unsplash.com/photo-1620352123547-5e60824b0254?w=400',
    },
  });

  console.log('📦 Product Categories created');

  // 7. Create Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Brass Ganesha Idol',
      description: 'Handcrafted pure brass Ganesha idol for prosperity and success.',
      category: 'Statues & Idols',
      categoryId: cat1.id,
      templeId: temple1.id,
      status: 'approved',
      image: 'https://images.unsplash.com/photo-1544161515-4af6b1d8d159?w=800',
      highlights: 'Pure brass, Hand-carved, 6 inches height',
      longDescription: 'This beautiful Ganesha idol is handcrafted by traditional artisans from Kashi. It represents wisdom and prosperity.',
      variants: {
        create: [
          { name: 'Small (4 inch)', price: 1200, stock: 50 },
          { name: 'Large (8 inch)', price: 2500, stock: 20 }
        ]
      }
    },
  });

  await prisma.product.create({
    data: {
      name: 'Organic Sandalwood Incense',
      description: 'Natural sandalwood incense sticks made from flower waste.',
      category: 'Incense & Fragrances',
      categoryId: cat2.id,
      status: 'approved',
      image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800',
      variants: {
        create: [
          { name: 'Pack of 50', price: 250, stock: 100 }
        ]
      }
    },
  });

  console.log('🛒 Products created');

  // 8. Create Pooja Bookings
  await prisma.poojaBooking.create({
    data: {
      userId: devotee.id,
      poojaId: createdPoojas[0].id,
      templeId: temple1.id,
      packageName: 'Standard',
      packagePrice: 2100,
      devoteeName: 'Rahul Sharma',
      devoteePhone: '9876543210',
      devoteeEmail: 'rahul@gmail.com',
      bookingDate: '2026-03-01',
      status: BookingStatus.BOOKED,
      commissionAmount: 105, // 5% of 2100
      netEarning: 1995,
    },
  });

  console.log('📅 Pooja Bookings created');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
