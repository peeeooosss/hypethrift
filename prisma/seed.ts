import { PrismaClient } from "./generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const CATEGORIES = [
  { name: "All Live", slug: "all", emoji: "🔥", color: "#121212", textColor: "#D4FF33" },
  { name: "Sneakers", slug: "sneakers", emoji: "👟", color: "#FF66B2", textColor: "#121212" },
  { name: "Streetwear", slug: "streetwear", emoji: "👕", color: "#33CCFF", textColor: "#121212" },
  { name: "Vintage", slug: "vintage", emoji: "👗", color: "#FF66B2", textColor: "#121212" },
  { name: "Bags", slug: "bags", emoji: "👜", color: "#D4FF33", textColor: "#121212" },
  { name: "Accessories", slug: "accessories", emoji: "🕶️", color: "#33CCFF", textColor: "#121212" },
  { name: "Denim", slug: "denim", emoji: "👖", color: "#FF66B2", textColor: "#121212" },
  { name: "Jewelry", slug: "jewelry", emoji: "💍", color: "#D4FF33", textColor: "#121212" },
  { name: "Outerwear", slug: "outerwear", emoji: "🧥", color: "#33CCFF", textColor: "#121212" },
];

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@hypethrift.com" },
    update: {},
    create: {
      email: "admin@hypethrift.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Platform Admin",
      role: "ADMIN",
    },
  });
  console.log("Seeded admin: admin@hypethrift.com / admin123");

  await prisma.user.upsert({
    where: { email: "seller@hypethrift.com" },
    update: {},
    create: {
      email: "seller@hypethrift.com",
      password: await bcrypt.hash("seller123", 10),
      name: "Demo Seller",
      role: "SELLER",
      sellerStatus: "APPROVED",
    },
  });
  console.log("Seeded seller: seller@hypethrift.com / seller123");

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
