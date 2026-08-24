import { PrismaClient } from "./generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { ITEM_PAYMENT_WINDOW_HOURS } from "../src/lib/platform";

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

const SELLERS = [
  {
    key: "archive",
    email: "seller@hypethrift.com",
    password: "seller123",
    name: "Demo Seller",
    storeName: "Demo Archive",
    storeDescription: "Curated sneakers and streetwear for demo testing.",
    location: "Mumbai, India",
    whatsappNumber: "9864854481",
  },
  {
    key: "streetvault",
    email: "streetvault@hypethrift.com",
    password: "vault123",
    name: "Aarav Mehta",
    storeName: "Street Vault",
    storeDescription: "Rare streetwear finds and everyday grails.",
    location: "Delhi, India",
    whatsappNumber: "9864854482",
  },
  {
    key: "closet",
    email: "vintagecloset@hypethrift.com",
    password: "closet123",
    name: "Mira Kapoor",
    storeName: "Mira's Vintage Closet",
    storeDescription: "Vintage bags, denim, and one-of-one archive pieces.",
    location: "Bengaluru, India",
    whatsappNumber: "9864854483",
  },
];

const BUYERS = [
  { key: "alex", email: "buyer@hypethrift.com", password: "buyer123", name: "Demo Buyer" },
  { key: "riya", email: "riya.buyer@hypethrift.com", password: "riya123", name: "Riya Sharma" },
  { key: "kabir", email: "kabir.buyer@hypethrift.com", password: "kabir123", name: "Kabir Singh" },
];

const LIVE_LISTINGS = [
  { id: "seed-Jordan 1 Chicago (2015)", title: "Jordan 1 Chicago (2015)", sellerKey: "archive", categorySlug: "sneakers", startingBid: 18500, currentBid: 19600, condition: "EXCELLENT", size: "UK 9.5", verified: true, hot: true, bidCount: 42, views: 128, watchers: 18 },
  { id: "seed-Yeezy 350 Zebra", title: "Yeezy 350 Zebra", sellerKey: "archive", categorySlug: "sneakers", startingBid: 12400, currentBid: 13800, condition: "GOOD", size: "UK 8.5", verified: true, hot: false, bidCount: 28, views: 89, watchers: 11 },
  { id: "seed-Dunk Low Panda", title: "Dunk Low Panda", sellerKey: "streetvault", categorySlug: "sneakers", startingBid: 8200, currentBid: 9700, condition: "EXCELLENT", size: "UK 9", verified: false, hot: true, bidCount: 56, views: 210, watchers: 26 },
  { id: "seed-Supreme Box Logo Tee", title: "Supreme Box Logo Tee", sellerKey: "streetvault", categorySlug: "streetwear", startingBid: 5600, currentBid: 7100, condition: "LIKE_NEW", size: "L", verified: true, hot: true, bidCount: 34, views: 156, watchers: 20 },
  { id: "seed-North Face Nuptse 1996", title: "North Face Nuptse 1996", sellerKey: "closet", categorySlug: "outerwear", startingBid: 8900, currentBid: 10500, condition: "EXCELLENT", size: "XL", verified: true, hot: true, bidCount: 47, views: 201, watchers: 24 },
  { id: "seed-Vintage Coach Shoulder Bag", title: "Vintage Coach Shoulder Bag", sellerKey: "closet", categorySlug: "bags", startingBid: 6400, currentBid: 7800, condition: "GOOD", size: "One Size", verified: true, hot: false, bidCount: 19, views: 74, watchers: 8 },
];

const REVIEW_LISTINGS = [
  { id: "seed-Vintage Fendi Baguette", title: "Vintage Fendi Baguette", sellerKey: "archive", categorySlug: "bags", startingBid: 12800, currentBid: 12800, condition: "GOOD", size: "One Size", verified: true, hot: true, bidCount: 0, views: 234, watchers: 0 },
  { id: "seed-Chrome Hearts Ring", title: "Chrome Hearts Ring", sellerKey: "streetvault", categorySlug: "jewelry", startingBid: 7500, currentBid: 7500, condition: "NEW", size: "One Size", verified: true, hot: false, bidCount: 0, views: 112, watchers: 0 },
];

const PAST_LISTINGS = [
  { id: "seed-past-Levi's 501 Big E", title: "Levi's 501 Big E", sellerKey: "closet", categorySlug: "denim", startingBid: 4800, currentBid: 6100, condition: "GOOD", size: "W32 L32", status: "ENDED" },
  { id: "seed-past-Louis Vuitton Pochette", title: "Louis Vuitton Pochette", sellerKey: "closet", categorySlug: "bags", startingBid: 12500, currentBid: 15800, condition: "EXCELLENT", size: "One Size", status: "SOLD" },
  { id: "seed-past-Varsity Jacket", title: "90s Varsity Jacket", sellerKey: "streetvault", categorySlug: "outerwear", startingBid: 5200, currentBid: 6800, condition: "GOOD", size: "M", status: "SOLD" },
];

type DemoBid = readonly [id: string, listingId: string, buyerKey: string, amount: number];

const LIVE_BIDS: DemoBid[] = [
  ["seed-live-jordan-alex", "seed-Jordan 1 Chicago (2015)", "alex", 19000],
  ["seed-live-jordan-riya", "seed-Jordan 1 Chicago (2015)", "riya", 19600],
  ["seed-live-yeezy-alex", "seed-Yeezy 350 Zebra", "alex", 13800],
  ["seed-live-yeezy-kabir", "seed-Yeezy 350 Zebra", "kabir", 13200],
  ["seed-live-dunk-riya", "seed-Dunk Low Panda", "riya", 9200],
  ["seed-live-dunk-kabir", "seed-Dunk Low Panda", "kabir", 9700],
  ["seed-live-supreme-alex", "seed-Supreme Box Logo Tee", "alex", 6800],
  ["seed-live-supreme-kabir", "seed-Supreme Box Logo Tee", "kabir", 7100],
  ["seed-live-nuptse-alex", "seed-North Face Nuptse 1996", "alex", 10500],
  ["seed-live-bag-riya", "seed-Vintage Coach Shoulder Bag", "riya", 7800],
];

const PAST_BIDS: DemoBid[] = [
  ["seed-past-bid-levi-alex", "seed-past-Levi's 501 Big E", "alex", 5600],
  ["seed-past-bid-levi-kabir", "seed-past-Levi's 501 Big E", "kabir", 6100],
  ["seed-past-bid-lv-riya", "seed-past-Louis Vuitton Pochette", "riya", 14800],
  ["seed-past-bid-lv-kabir", "seed-past-Louis Vuitton Pochette", "kabir", 15800],
  ["seed-past-bid-varsity-alex", "seed-past-Varsity Jacket", "alex", 6800],
  ["seed-past-bid-varsity-riya", "seed-past-Varsity Jacket", "riya", 6200],
];

async function upsertUser(data: { email: string; password: string; name: string; role: string; sellerStatus?: string; listingCredits?: number }) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      password: await bcrypt.hash(data.password, 10),
      role: data.role as any,
      sellerStatus: data.sellerStatus as any,
      listingCredits: data.listingCredits,
      isBanned: false,
    },
    create: {
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      name: data.name,
      role: data.role as any,
      sellerStatus: data.sellerStatus as any,
      listingCredits: data.listingCredits ?? 0,
    },
  });
}

async function upsertListing(
  listing: {
    id: string;
    title: string;
    sellerKey: string;
    categorySlug: string;
    startingBid: number;
    currentBid: number;
    condition: string;
    size: string;
    verified?: boolean;
    hot?: boolean;
    bidCount?: number;
    views?: number;
    watchers?: number;
    status?: string;
  },
  sellers: Record<string, { id: string }>,
  endsAt: Date,
) {
  return prisma.listing.upsert({
    where: { id: listing.id },
    update: {
      title: listing.title,
      seller: { connect: { id: sellers[listing.sellerKey].id } },
      category: { connect: { slug: listing.categorySlug } },
      startingBid: listing.startingBid,
      currentBid: listing.currentBid,
      status: (listing.status ?? "ACTIVE") as any,
      condition: listing.condition as any,
      size: listing.size,
      verified: listing.verified ?? false,
      hot: listing.hot ?? false,
      bidCount: listing.bidCount ?? 0,
      views: listing.views ?? 0,
      watchers: listing.watchers ?? 0,
      endsAt,
    },
    create: {
      id: listing.id,
      title: listing.title,
      description: "Premium vintage piece, fully authenticated for demo purposes.",
      category: { connect: { slug: listing.categorySlug } },
      seller: { connect: { id: sellers[listing.sellerKey].id } },
      images: [],
      startingBid: listing.startingBid,
      currentBid: listing.currentBid,
      bidIncrement: 50,
      status: (listing.status ?? "ACTIVE") as any,
      verified: listing.verified ?? false,
      hot: listing.hot ?? false,
      condition: listing.condition as any,
      size: listing.size,
      bidCount: listing.bidCount ?? 0,
      views: listing.views ?? 0,
      watchers: listing.watchers ?? 0,
      endsAt,
    },
  });
}

async function upsertBid(id: string, listingId: string, bidderId: string, amount: number) {
  return prisma.bid.upsert({
    where: { id },
    update: { listingId, bidderId, amount },
    create: { id, listingId, bidderId, amount },
  });
}

async function main() {
  await upsertUser({ email: "admin@hypethrift.com", password: "admin123", name: "Platform Admin", role: "ADMIN" });
  console.log("Seeded admin: admin@hypethrift.com / admin123");

  const sellers: Record<string, { id: string }> = {};
  for (const sellerData of SELLERS) {
    const seller = await upsertUser({
      ...sellerData,
      role: "SELLER",
      sellerStatus: "APPROVED",
      listingCredits: 10,
    });
    sellers[sellerData.key] = seller;
    await prisma.sellerProfile.upsert({
      where: { userId: seller.id },
      update: {
        storeName: sellerData.storeName,
        storeDescription: sellerData.storeDescription,
        location: sellerData.location,
        whatsappNumber: sellerData.whatsappNumber,
        acceptedAgreement: true,
        acceptedAt: new Date(),
      },
      create: {
        userId: seller.id,
        storeName: sellerData.storeName,
        storeDescription: sellerData.storeDescription,
        location: sellerData.location,
        whatsappNumber: sellerData.whatsappNumber,
        acceptedAgreement: true,
        acceptedAt: new Date(),
      },
    });
    console.log(`Seeded seller: ${sellerData.email} / ${sellerData.password}`);
  }

  const buyers: Record<string, { id: string }> = {};
  for (const buyerData of BUYERS) {
    const buyer = await upsertUser({ ...buyerData, role: "CUSTOMER" });
    buyers[buyerData.key] = buyer;
    console.log(`Seeded buyer: ${buyerData.email} / ${buyerData.password}`);
  }

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, emoji: category.emoji, color: category.color, textColor: category.textColor },
      create: category,
    });
  }

  const liveEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pastEndsAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  for (const listing of LIVE_LISTINGS) await upsertListing(listing, sellers, liveEndsAt);
  for (const listing of REVIEW_LISTINGS) await upsertListing({ ...listing, status: "PENDING_REVIEW" }, sellers, liveEndsAt);
  for (const listing of PAST_LISTINGS) await upsertListing(listing, sellers, pastEndsAt);
  console.log(`Seeded ${LIVE_LISTINGS.length} live listings, ${REVIEW_LISTINGS.length} review listings, and ${PAST_LISTINGS.length} past listings`);

  for (const [id, listingId, buyerKey, amount] of LIVE_BIDS) {
    await upsertBid(id, listingId, buyers[buyerKey].id, amount);
  }
  for (const [id, listingId, buyerKey, amount] of PAST_BIDS) {
    await upsertBid(id, listingId, buyers[buyerKey].id, amount);
  }

  const alex = buyers.alex;
  const riya = buyers.riya;
  const kabir = buyers.kabir;
  await prisma.order.upsert({
    where: { listingId: "seed-past-Levi's 501 Big E" },
    update: { buyerId: kabir.id, sellerId: sellers.closet.id, finalPrice: 6100, status: "PENDING_CONTACT_FEE", paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    create: { listingId: "seed-past-Levi's 501 Big E", buyerId: kabir.id, sellerId: sellers.closet.id, finalPrice: 6100, platformFee: 69, status: "PENDING_CONTACT_FEE", paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  await prisma.order.upsert({
    where: { listingId: "seed-past-Louis Vuitton Pochette" },
    update: { buyerId: kabir.id, sellerId: sellers.closet.id, finalPrice: 15800, status: "COMPLETED", paymentDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    create: { listingId: "seed-past-Louis Vuitton Pochette", buyerId: kabir.id, sellerId: sellers.closet.id, finalPrice: 15800, platformFee: 69, status: "COMPLETED", paymentDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  });
  await prisma.order.upsert({
    where: { listingId: "seed-past-Varsity Jacket" },
    update: {
      buyerId: alex.id,
      sellerId: sellers.streetvault.id,
      finalPrice: 6800,
      status: "CONTACT_FEE_PAID",
      paymentDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      itemPaymentDeadline: new Date(Date.now() + ITEM_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
      buyerAgreementAccepted: true,
      contactFeeConfirmed: true,
      buyerPhone: "9876543210",
      paidVia: "Google Pay",
      shippingAddress: { label: "Home", line1: "123 Demo Street", city: "Mumbai", state: "Maharashtra", pincode: "400001", country: "India" },
      sellerOrderDetails: {},
      sellerMarkedReadyAt: null,
      buyerConfirmedAt: null,
    },
    create: {
      listingId: "seed-past-Varsity Jacket",
      buyerId: alex.id,
      sellerId: sellers.streetvault.id,
      finalPrice: 6800,
      platformFee: 69,
      status: "CONTACT_FEE_PAID",
      paymentDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      itemPaymentDeadline: new Date(Date.now() + ITEM_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
      buyerAgreementAccepted: true,
      contactFeeConfirmed: true,
      buyerPhone: "9876543210",
      paidVia: "Google Pay",
      shippingAddress: { label: "Home", line1: "123 Demo Street", city: "Mumbai", state: "Maharashtra", pincode: "400001", country: "India" },
    },
  });

  console.log("Seeded live and past bids for all demo buyers");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
