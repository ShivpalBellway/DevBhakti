const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const temples = await prisma.temple.findMany({
    select: {
      id: true,
      name: true,
      templeId: true
    }
  });
  console.log(JSON.stringify(temples, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
