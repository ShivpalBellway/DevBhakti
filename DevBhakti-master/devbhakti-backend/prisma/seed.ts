import { PrismaClient, UserRole, BookingStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data (in reverse order of dependencies)
  await prisma.withdrawalRequest.deleteMany();
  await prisma.templeLedger.deleteMany();
  await prisma.mandalWithdrawalRequest.deleteMany();
  await prisma.mandalLedger.deleteMany();
  await prisma.darshanTicket.deleteMany();
  await prisma.darshanSlot.deleteMany();
  await prisma.mandalDarshanTicket.deleteMany();
  await prisma.mandalDarshanSlot.deleteMany();
  await prisma.bookingAvailability.deleteMany();
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
  await prisma.mandal.deleteMany();
  await prisma.temple.deleteMany();
  await prisma.sellerProfile.deleteMany();
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

  const templeUser1 = await prisma.user.create({
    data: {
      name: 'Kashi Temple Admin',
      email: 'kashi@temple.com',
      password: hashedPassword,
      role: UserRole.INSTITUTION,
      isVerified: true,
    },
  });

  const templeUser2 = await prisma.user.create({
    data: {
      name: 'Kedarnath Temple Admin',
      email: 'kedarnath@temple.com',
      password: hashedPassword,
      role: UserRole.INSTITUTION,
      isVerified: true,
    },
  });

  const mandalUser1 = await prisma.user.create({
    data: {
      name: 'Lalbaugcha Raja Mandal Admin',
      email: 'mandal@devbhakti.com',
      password: hashedPassword,
      role: UserRole.INSTITUTION,
      isVerified: true,
    },
  });

  console.log('👤 Users created');

  // 2.2 Create SellerProfile
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      name: { en: 'Devotional Store', hi: 'भक्ति स्टोर' },
      location: { en: 'Haridwar, Uttarakhand', hi: 'हरिद्वार, उत्तराखंड' },
      fullAddress: { en: 'Ghat Road, Haridwar, Uttarakhand 249401', hi: 'घाट रोड, हरिद्वार, उत्तराखंड 249401' },
      description: { en: 'Authentic spiritual items and pooja essentials.', hi: 'प्रामाणिक आध्यात्मिक वस्तुएं और पूजा सामग्री।' },
      category: { en: 'Spirituality', hi: 'आध्यात्मिकता' },
      userId: sellerUser.id,
      productCommissionRate: 10.0,
      pickupLocation: 'HARIDWAR_MAIN'
    }
  });

  console.log('🏪 Seller Profile created');

  // 2.1 Create Banners
  await prisma.banner.createMany({
    data: [
      {
        image: 'https://images.unsplash.com/photo-1544161515-4af6b1d8d159?w=1200&q=80',
        link: '/pooja/rudrabhishek',
        active: true,
        order: 1,
        title: { en: 'Experience Divine Blessings', hi: 'दैवीय आशीर्वाद का अनुभव करें', mr: 'दैवी आशीर्वादाचा अनुभव घ्या' },
        subtitle: { en: 'Book your online pooja today', hi: 'आज ही अपनी ऑनलाइन पूजा बुक करें', mr: 'आजच तुमची ऑनलाइन पूजा बुक करा' }
      },
      {
        image: 'https://images.unsplash.com/photo-1590050752117-23a9d7fc2140?w=1200&q=80',
        link: '/temple/kashi-vishwanath',
        active: true,
        order: 2,
        title: { en: 'Visit Kashi Vishwanath', hi: 'काशी विश्वनाथ के दर्शन करें', mr: 'काशी विश्वनाथचे दर्शन घ्या' },
        subtitle: { en: 'Virtual tour and online offerings', hi: 'वर्चुअल टूर और ऑनलाइन प्रसाद', mr: 'व्हर्च्युअल टूर आणि ऑनलाइन प्रसाद' }
      },
      {
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
        link: '/products',
        active: true,
        order: 3,
        title: { en: 'Spiritual Marketplace', hi: 'आध्यात्मिक बाजार', mr: 'आध्यात्मिक बाजार' },
        subtitle: { en: 'Authentic items from holy cities', hi: 'पवित्र शहरों से प्रामाणिक वस्तुएं', mr: 'पवित्र शहरांमधून अस्सल वस्तू' }
      }
    ]
  });

  console.log('🖼️  Banners created');

  // 3. Create Temples
  const temple1 = await prisma.temple.create({
    data: {
      name: { en: 'Kashi Vishwanath Temple', hi: 'काशी विश्वनाथ मंदिर' },
      location: { en: 'Varanasi, Uttar Pradesh', hi: 'वाराणसी, उत्तर प्रदेश' },
      fullAddress: { en: 'Lahori Tola, Varanasi, Uttar Pradesh 221001', hi: 'लाहौरी टोला, वाराणसी, उत्तर प्रदेश 221001' },
      description: { en: 'The Kashi Vishwanath Temple is one of the most famous Hindu temples dedicated to Lord Shiva.', hi: 'काशी विश्वनाथ मंदिर भगवान शिव को समर्पित सबसे प्रसिद्ध हिंदू मंदिरों में से एक है।' },
      history: { en: 'The temple has been destroyed and reconstructed several times in history. The current structure was built by Ahilyabai Holkar of Indore in 1780.', hi: 'मंदिर को इतिहास में कई बार नष्ट और पुनर्निर्मित किया गया है। वर्तमान संरचना 1780 में इंदौर की अहिल्याबाई होल्कर द्वारा बनाई गई थी।' },
      category: { en: 'Jyotirlinga', hi: 'ज्योतिर्लिंग' },
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
      name: { en: 'Kedarnath Temple' },
      location: { en: 'Rudraprayag, Uttarakhand' },
      fullAddress: { en: 'Kedarnath, Uttarakhand 246445' },
      description: { en: 'Kedarnath Temple is a Hindu temple dedicated to Lord Shiva, located on the Garhwal Himalayan range near the Mandakini river.' },
      history: { en: 'According to Hindu legends, the temple was initially built by Pandavas, and is one of the twelve Jyotirlingas.' },
      category: { en: 'Jyotirlinga' },
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

  // 3.1 Create Mandal
  const mandal1 = await prisma.mandal.create({
    data: {
      name: { en: 'Lalbaugcha Raja Sarvajanik Ganeshotsav Mandal', hi: 'लालबागचा राजा सार्वजनिक गणेशोत्सव मंडल' },
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Lalbaug Market, GD Ambekar Marg, Mumbai, Maharashtra 400012',
      contactNumber: '9876543210',
      description: { en: 'Famous Ganesh Mandal in Mumbai hosting thousands of devotees every day.', hi: 'मुंबई का प्रसिद्ध गणेश मंडल जहां रोजाना हजारों भक्त आते हैं।' },
      userId: mandalUser1.id,
      image: 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&q=80',
      bannerImages: [
        'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=1200'
      ],
      status: 'APPROVED'
    }
  });

  console.log('🚩 Mandal created');

  // 4. Create Events
  await prisma.event.createMany({
    data: [
      {
        name: { en: 'Maha Shivratri Celebration' },
        date: '2026-02-26',
        description: { en: 'Grand celebration of Maha Shivratri with overnight prayers and rituals.' },
        templeId: temple1.id,
      },
      {
        name: { en: 'Ganga Aarti' },
        date: 'Daily',
        description: { en: 'Special evening ritual performed on the banks of the Ganges.' },
        templeId: temple1.id,
      },
      {
        name: { en: 'Kedarnath Opening Ceremony' },
        date: '2026-05-10',
        description: { en: 'Traditional ceremony marking the opening of the temple doors for devotees.' },
        templeId: temple2.id,
      },
    ],
  });

  console.log('📅 Events created');

  // 5. Create Poojas
  const poojas = [
    {
      name: { en: 'Rudrabhishek Pooja' },
      category: { en: 'Special Pooja' },
      price: 2100,
      duration: { en: '45-60 mins' },
      description: { en: ['A powerful ritual of bathing the Shiva Lingam with various offerings.'] },
      time: '6:00 AM',
      image: 'https://images.unsplash.com/photo-1541093126081-3069154b0366?w=800',
      about: { en: 'Rudrabhishek is a ritual where a Panchamrut is offered to Lord Shiva along with many other precious items.' },
      benefits: { en: ['Spiritual growth', 'Removal of obstacles', 'Peace and prosperity'] },
      bullets: { en: ['Live streaming available', 'Prasad will be sent via couriers', 'Personalized Sankalpa'] },
      templeId: temple1.id,
      packages: [
        { 
          name: { en: 'Standard', hi: 'मानक', mr: 'मानक' }, 
          price: 2100, 
          description: { en: 'Single devotee Rudrabhishek', hi: 'एकल भक्त रुद्राभिषेक', mr: 'एकल भक्त रुद्राभिषेक' } 
        },
        { 
          name: { en: 'Family', hi: 'परिवार', mr: 'कुटुंब' }, 
          price: 5100, 
          description: { en: 'Rudrabhishek for the whole family', hi: 'पूरे परिवार के लिए रुद्राभिषेक', mr: 'संपूर्ण कुटुंबासाठी रुद्राभिषेक' } 
        }
      ],
      faqs: [
        {
          question: { en: 'Is prasad included?', hi: 'क्या प्रसाद शामिल है?', mr: 'प्रसाद समाविष्ट आहे का?' },
          answer: { en: 'Yes, prasad will be sent to your address.', hi: 'हाँ, प्रसाद आपके पते पर भेजा जाएगा।', mr: 'हो, प्रसाद तुमच्या पत्त्यावर पाठवला जाईल.' }
        }
      ],
      processSteps: {
        en: ['Sankalpa', 'Abhishek', 'Aarti'],
        hi: ['संकल्प', 'अभिषेक', 'आरती'],
        mr: ['संकल्प', 'अभिषेक', 'आरती']
      }
    },
    {
      name: { en: 'Maha Mrityunjaya Jaap' },
      category: { en: 'Healing Pooja' },
      price: 5000,
      duration: { en: '3 hours' },
      description: { en: ['A sacred chant for longevity and overcoming fear of death.'] },
      time: '5:00 AM',
      image: 'https://images.unsplash.com/photo-1561007011-2834fa39556d?w=800',
      templeId: temple1.id,
      packages: [
        { name: '1.25 Lakh Jaap', price: 11000, description: 'Intensive chanting by 5 priests' }
      ],
    },
    {
      name: { en: 'Special Ganga Aarti' },
      category: { en: 'Aarti' },
      price: 1100,
      duration: { en: '30 mins' },
      description: { en: ['A personalized participation in the grand evening aarti at Dashashwamedh Ghat.'] },
      time: '6:30 PM',
      image: 'https://images.unsplash.com/photo-1590050752117-23a9d7fc2140?w=800',
      templeId: temple1.id,
      packages: [
        { name: 'Single', price: 1100, description: 'Single person participation' },
        { name: 'Couple', price: 2100, description: 'Couple participation' }
      ],
    },
    {
      name: { en: 'Kedarnath Shringar Pooja' },
      category: { en: 'Special Pooja' },
      price: 3500,
      duration: { en: '60 mins' },
      description: { en: ['A special ritual focused on the decoration of the deity with flowers and sandalwood.'] },
      time: '7:00 AM',
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
      about: { en: 'The Shringar pooja at Kedarnath is one of the most aesthetic and spiritually uplifting rituals.' },
      benefits: { en: ['Aesthetic satisfaction', 'Spiritual peace', 'Closeness to the divine'] },
      bullets: { en: ['Fresh flowers used', 'Priest-led ritual', 'Digital certificate included'] },
      templeId: temple2.id,
      packages: [
        { name: 'Standard', price: 3500, description: 'Basic decoration pooja' },
        { name: 'Grand', price: 7500, description: 'Extensive decoration with special herbs' }
      ],
    },
    {
      name: { en: 'Akhand Jyoti Deepam' },
      category: { en: 'Daily Ritual' },
      price: 501,
      duration: { en: 'Continuous' },
      description: { en: ['Lighting an eternal lamp in your name for 24 hours.'] },
      time: 'Anytime',
      image: 'https://images.unsplash.com/photo-1594142142270-496359f5187e?w=800',
      templeId: temple2.id,
      packages: [
        { name: '1 Day', price: 501, description: '24 hours lamp' },
        { name: '7 Days', price: 2100, description: '1 week eternal lamp' }
      ],
    },
    {
      name: { en: 'Shiva Sahasranama Archana' },
      category: { en: 'Archana' },
      price: 501,
      duration: { en: '30 mins' },
      description: { en: ['Recitation of 1000 names of Lord Shiva.'] },
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
      name: { en: 'Statues & Idols' },
      description: { en: 'Beautifully crafted divine idols for your home temple.' },
      image: 'https://images.unsplash.com/photo-1582234052309-8f0a0e5b0e5b?w=400',
    },
  });

  const cat2 = await prisma.productCategory.create({
    data: {
      name: { en: 'Incense & Fragrances' },
      description: { en: 'Organic and traditional incense sticks and dhoop.' },
      image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400',
    },
  });

  const cat3 = await prisma.productCategory.create({
    data: {
      name: { en: 'Puja Essentials' },
      description: { en: 'Everything you need for your daily rituals.' },
      image: 'https://images.unsplash.com/photo-1620352123547-5e60824b0254?w=400',
    },
  });

  console.log('📦 Product Categories created');

  // 7. Create Products
  const product1 = await prisma.product.create({
    data: {
      name: { en: 'Brass Ganesha Idol' },
      description: { en: 'Handcrafted pure brass Ganesha idol for prosperity and success.' },
      category: { en: 'Statues & Idols' },
      categoryId: cat1.id,
      templeId: temple1.id,
      status: 'approved',
      image: 'https://images.unsplash.com/photo-1544161515-4af6b1d8d159?w=800',
      highlights: { en: 'Pure brass, Hand-carved, 6 inches height' },
      longDescription: { en: 'This beautiful Ganesha idol is handcrafted by traditional artisans from Kashi. It represents wisdom and prosperity.' },
      variants: {
        create: [
          { name: { en: 'Small (4 inch)' }, price: 1200, stock: 50 },
          { name: { en: 'Large (8 inch)' }, price: 2500, stock: 20 }
        ]
      }
    },
  });

  await prisma.product.create({
    data: {
      name: { en: 'Organic Sandalwood Incense' },
      description: { en: 'Natural sandalwood incense sticks made from flower waste.' },
      category: { en: 'Incense & Fragrances' },
      categoryId: cat2.id,
      status: 'approved',
      image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800',
      variants: {
        create: [
          { name: { en: 'Pack of 50' }, price: 250, stock: 100 }
        ]
      }
    },
  });

  console.log('🛒 Products created');

  // 8. Create Pooja Bookings
  await prisma.poojaBooking.create({
    data: {
        displayId: 'PB-001',
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

  // 9. Create Standard FAQs
  await prisma.standardFAQ.createMany({
    data: [
      {
        question: { en: 'How do I book a pooja?' },
        answer: { en: 'You can browse available poojas by temple or category and click the Book Now button.' },
        order: 1
      },
      {
        question: { en: 'When will I receive the prasad?' },
        answer: { en: 'Prasad is usually dispatched within 48 hours of pooja completion and takes 3-5 days for delivery.' },
        order: 2
      }
    ]
  });

  console.log('❓ Standard FAQs created');

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
