const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const categories = [
        "Birthday",
        "Wedding/Anniversary",
        "Grah Pravesh",
        "Shanti Path",
        "New Born Baby",
        "Good Luck",
        "Health Recovery",
        "Business Success",
        "Vastu Dosha",
        "Pitru Dosha"
    ];

    for (const name of categories) {
        await prisma.poojaCategory.upsert({
            where: { name },
            update: {},
            create: { name, status: "APPROVED" }
        });
    }

    console.log("Seed complete: Pooja categories added.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
