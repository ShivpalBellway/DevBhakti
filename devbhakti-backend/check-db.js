const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Checking Categories ===');
    const categories = await prisma.productCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true
      }
    });
    console.log('Categories found:', categories.length);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });

    console.log('\n=== Checking Products ===');
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        categoryId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Recent products:');
    products.forEach(prod => {
      console.log(`- ${prod.name} (Category: ${prod.category}, CategoryId: ${prod.categoryId})`);
    });

    console.log('\n=== Checking Product with CategoryObj ===');
    const productWithCategory = await prisma.product.findFirst({
      where: {
        categoryId: { not: null }
      },
      include: {
        categoryObj: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
    
    if (productWithCategory) {
      console.log('Product with category:');
      console.log(`- Product: ${productWithCategory.name}`);
      console.log(`- CategoryId: ${productWithCategory.categoryId}`);
      console.log(`- CategoryObj:`, productWithCategory.categoryObj);
    } else {
      console.log('No products found with categoryId');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
