import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Pooja Categories...');

  // Clear existing categories
  await prisma.poojaCategory.deleteMany();

  const poojaCategories = [
    {
      name: 'Daily Prayers',
      status: 'APPROVED',
    },
    {
      name: 'Family Blessings',
      status: 'APPROVED',
    },
    {
      name: 'Health & Wellness',
      status: 'APPROVED',
    },
    {
      name: 'Career & Success',
      status: 'APPROVED',
    },
    {
      name: 'Marriage & Love',
      status: 'APPROVED',
    },
    {
      name: 'Education & Learning',
      status: 'APPROVED',
    },
    {
      name: 'Wealth & Prosperity',
      status: 'APPROVED',
    },
    {
      name: 'Child Blessings',
      status: 'APPROVED',
    },
    {
      name: 'Festival Special',
      status: 'APPROVED',
    },
    {
      name: 'Spiritual Growth',
      status: 'APPROVED',
    },
    {
      name: 'Home Blessing',
      status: 'APPROVED',
    },
    {
      name: 'Ancestral Rituals',
      status: 'APPROVED',
    },
    {
      name: 'Protection & Safety',
      status: 'APPROVED',
    },
    {
      name: 'Debt Relief',
      status: 'APPROVED',
    },
    {
      name: 'Journey & Travel',
      status: 'APPROVED',
    },
  ];

  for (const category of poojaCategories) {
    await prisma.poojaCategory.create({
      data: category,
    });
  }

  console.log(`✅ ${poojaCategories.length} Pooja Categories seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
