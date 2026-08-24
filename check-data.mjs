import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, size: true, status: true, categoryId: true }
  });
  console.log(JSON.stringify(listings, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);