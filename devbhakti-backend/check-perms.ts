import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allPerms = await prisma.permission.count();
  const adminPerms = await prisma.permission.count({
    where: { applicableTo: { has: 'ADMIN' } }
  });
  const templePerms = await prisma.permission.count({
    where: { applicableTo: { has: 'TEMPLE' } }
  });
  const sellerPerms = await prisma.permission.count({
    where: { applicableTo: { has: 'SELLER' } }
  });

  console.log({
    total: allPerms,
    admin: adminPerms,
    temple: templePerms,
    seller: sellerPerms
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
