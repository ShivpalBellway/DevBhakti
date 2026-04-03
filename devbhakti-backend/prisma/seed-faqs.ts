import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FAQs...');

  // Clear existing FAQs
  await prisma.standardFAQ.deleteMany();

  const faqs = [
    {
      question: 'What does this pooja include?',
      answer: 'This pooja includes basic samagri and is performed as per temple rituals. Specific inclusions may vary depending on the temple.',
      order: 1,
      isActive: true,
    },
    {
      question: 'Will a priest (pandit) perform the pooja?',
      answer: 'Yes, the pooja is performed by a qualified priest. Please refer to the pooja description for details.',
      order: 2,
      isActive: true,
    },
    {
      question: 'Do I need to be physically present for the pooja?',
      answer: 'No, your physical presence is not required. The temple will perform the pooja on your behalf.',
      order: 3,
      isActive: true,
    },
    {
      question: 'Will I receive prasad or confirmation?',
      answer: 'Prasad may be provided depending on the temple and pooja selected. Please refer to the pooja description for details. You will receive confirmation once the pooja is completed.',
      order: 4,
      isActive: true,
    },
    {
      question: 'Can I choose a specific date or time?',
      answer: 'Yes, you can select your preferred date while booking, subject to temple availability.',
      order: 5,
      isActive: true,
    },
  ];

  for (const faq of faqs) {
    await prisma.standardFAQ.create({
      data: faq,
    });
  }

  console.log(`✅ ${faqs.length} FAQs seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
}

