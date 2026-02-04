const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true
    }
  });
  console.log(JSON.stringify(categories, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
