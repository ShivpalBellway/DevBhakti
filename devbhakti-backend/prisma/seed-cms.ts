import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CMS content (Features, Testimonials, Banners, etc.)...');

  // Clear existing data
  await prisma.feature.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.cTACard.deleteMany();

  // Seed Features
  const features = [
    {
      title: 'Easy Pooja Booking',
      description: 'Book sacred ceremonies online with instant confirmation',
      image: '/features/pooja-booking.jpg',
      icon: '🙏',
      active: true,
      order: 1,
    },
    {
      title: 'Live Darshan',
      description: 'Watch temple aartis and rituals in real-time from home',
      image: '/features/live-darshan.jpg',
      icon: '📱',
      active: true,
      order: 2,
    },
    {
      title: 'Devotional Products',
      description: 'Authentic puja kits and sacred items delivered to you',
      image: '/features/products.jpg',
      icon: '🛍️',
      active: true,
      order: 3,
    },
    {
      title: 'Temple Donations',
      description: 'Make secure donations with instant 80G tax certificates',
      image: '/features/donations.jpg',
      icon: '💝',
      active: true,
      order: 4,
    },
    {
      title: 'Prasad Delivery',
      description: 'Blessed offerings delivered from temple sanctum',
      image: '/features/prasad.jpg',
      icon: '📦',
      active: true,
      order: 5,
    },
    {
      title: 'Temple Discovery',
      description: 'Find ancient temples and connect with pandits near you',
      image: '/features/discovery.jpg',
      icon: '🗺️',
      active: true,
      order: 6,
    },
  ];

  for (const feature of features) {
    await prisma.feature.create({
      data: feature,
    });
  }

  console.log(`✅ ${features.length} Features seeded`);

  // Seed Testimonials
  const testimonials = [
    {
      title: 'Spiritual Connection',
      subtitle: 'Finally a platform that brings temple closer to me',
      videoSrc: 'https://youtu.be/dQw4w9WgXcQ',
      thumbnail: '/testimonials/testimonial-1.jpg',
      category: 'Devotee',
      active: true,
      order: 1,
    },
    {
      title: 'Convenience at its Best',
      subtitle: 'Booking poojas has never been this easy',
      videoSrc: 'https://youtu.be/dQw4w9WgXcQ',
      thumbnail: '/testimonials/testimonial-2.jpg',
      category: 'Devotee',
      active: true,
      order: 2,
    },
    {
      title: 'Business Growth',
      subtitle: 'DevBhakti helped our temple reach more devotees',
      videoSrc: 'https://youtu.be/dQw4w9WgXcQ',
      thumbnail: '/testimonials/testimonial-3.jpg',
      category: 'Temple',
      active: true,
      order: 3,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({
      data: testimonial,
    });
  }

  console.log(`✅ ${testimonials.length} Testimonials seeded`);

  // Seed CTA Cards
  const ctaCards = [
    {
      title: 'Book a Pooja',
      points: ['Instant confirmation', 'SMS updates', 'Flexible rescheduling'],
      icon: '🙏',
      buttonText: 'Explore Poojas',
      buttonLink: '/poojas',
      cardType: 'primary',
      active: true,
      order: 1,
    },
    {
      title: 'Make a Donation',
      points: ['80G Tax certificate', 'Secure payment', 'Direct to temple'],
      icon: '💝',
      buttonText: 'Donate Now',
      buttonLink: '/donation',
      cardType: 'secondary',
      active: true,
      order: 2,
    },
    {
      title: 'Watch Live Darshan',
      points: ['Crystal clear streaming', 'Multiple temples', 'Festival specials'],
      icon: '📱',
      buttonText: 'View Live',
      buttonLink: '/live-darshan',
      cardType: 'tertiary',
      active: true,
      order: 3,
    },
  ];

  for (const cta of ctaCards) {
    await prisma.cTACard.create({
      data: cta,
    });
  }

  console.log(`✅ ${ctaCards.length} CTA Cards seeded`);
  console.log('✅ All CMS content seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
