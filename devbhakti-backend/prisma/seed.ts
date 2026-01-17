import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@devbhakti.com';
  const adminPassword = 'admin123'; // New Password

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('✅ Admin user updated/created successfully:');
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
