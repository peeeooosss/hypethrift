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

const DEMO_LISTINGS = [
  { title: "Jordan 1 Chicago (2015)", slug: "sneakers", emoji: "👟", bg: "#FF66B2", startingBid: 18500, bids: 42, viewers: 128, hot: true, verified: true, condition: "EXCELLENT", status: "ACTIVE", size: "UK 9.5" },
  { title: "Yeezy 350 Zebra", slug: "sneakers", emoji: "👟", bg: "#33CCFF", startingBid: 12400, bids: 28, viewers: 89, hot: false, verified: true, condition: "GOOD", status: "ACTIVE", size: "UK 8.5" },
  { title: "Dunk Low Panda", slug: "sneakers", emoji: "👟", bg: "#D4FF33", startingBid: 8200, bids: 56, viewers: 210, hot: true, verified: false, condition: "EXCELLENT", status: "ACTIVE", size: "UK 9" },
  { title: "Supreme Box Logo Tee", slug: "streetwear", emoji: "👕", bg: "#FF66B2", startingBid: 5600, bids: 34, viewers: 156, hot: true, verified: true, condition: "LIKE_NEW", status: "ACTIVE", size: "L" },
  { title: "Vintage Fendi Baguette", slug: "bags", emoji: "👜", bg: "#D4FF33", startingBid: 12800, bids: 52, viewers: 234, hot: true, verified: true, condition: "GOOD", status: "PENDING_REVIEW", size: "One Size" },
  { title: "Chrome Hearts Ring", slug: "jewelry", emoji: "💍", bg: "#33CCFF", startingBid: 7500, bids: 31, viewers: 112, hot: false, verified: true, condition: "NEW", status: "PENDING_REVIEW", size: "One Size" },
  { title: "North Face Nuptse 1996", slug: "outerwear", emoji: "🧥", bg: "#33CCFF", startingBid: 8900, bids: 47, viewers: 201, hot: true, verified: true, condition: "EXCELLENT", status: "ACTIVE", size: "XL" },
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

  const seller = await prisma.user.upsert({
    where: { email: "seller@hypethrift.com" },
    update: { listingCredits: 10 },
    create: {
      email: "seller@hypethrift.com",
      password: await bcrypt.hash("seller123", 10),
      name: "Demo Seller",
      role: "SELLER",
      sellerStatus: "APPROVED",
      listingCredits: 10,
    },
  });
  console.log("Seeded seller: seller@hypethrift.com / seller123");

  await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: { whatsappNumber: "9864854481", acceptedAgreement: true, acceptedAt: new Date() },
    create: {
      userId: seller.id,
      storeName: "Demo Archive",
      storeDescription: "Demo seller profile for local testing.",
      location: "India",
      whatsappNumber: "9864854481",
      acceptedAgreement: true,
      acceptedAt: new Date(),
    },
  });

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);

  const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  for (const l of DEMO_LISTINGS) {
    await prisma.listing.upsert({
      where: { id: `seed-${l.title}` },
      update: { currentBid: l.startingBid, status: l.status as any, size: l.size as any, endsAt },
      create: {
        id: `seed-${l.title}`,
        title: l.title,
        description: "Premium vintage piece, fully authenticated.",
        category: { connect: { slug: l.slug } },
        seller: { connect: { id: seller.id } },
        images: [],
        startingBid: l.startingBid,
        currentBid: l.startingBid,
        bidIncrement: 50,
        status: l.status as any,
        verified: l.verified,
        hot: l.hot,
         condition: l.condition as any,
         size: l.size as any,
         endsAt,
      },
    });
  }
  console.log(`Seeded ${DEMO_LISTINGS.length} demo listings`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
