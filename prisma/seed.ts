import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

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
  { id: "seed-Jordan 1 Chicago (2015)", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUpJhBJgv1XCluO2W14MIgGbH07tQ63idAYz5v"], title: "Jordan 1 Chicago (2015)", sellerKey: "archive", categorySlug: "sneakers", startingBid: 18500, currentBid: 19600, condition: "EXCELLENT", size: "UK 9.5", verified: true, hot: true, bidCount: 42, views: 128, watchers: 18, endHoursFromNow: 23 },
  { id: "seed-Yeezy 350 Zebra", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUHA44cQGNqrYIPGpuoTSHebvticB5lEDOR306"], title: "Yeezy 350 Zebra", sellerKey: "archive", categorySlug: "sneakers", startingBid: 12400, currentBid: 13800, condition: "GOOD", size: "UK 8.5", verified: true, hot: false, bidCount: 28, views: 89, watchers: 11, endHoursFromNow: 47 },
  { id: "seed-Dunk Low Panda", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUCYdWbxz8gyBb9VZjOYE1Ql7u30dt4pqm2ScG"], title: "Dunk Low Panda", sellerKey: "streetvault", categorySlug: "sneakers", startingBid: 8200, currentBid: 9700, condition: "EXCELLENT", size: "UK 9", verified: false, hot: true, bidCount: 56, views: 210, watchers: 26, endHoursFromNow: 10 },
  { id: "seed-Supreme Box Logo Tee", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUDdi4zxEy2bS5eRWUXOQiv7ckpJoCzN60PuaK"], title: "Supreme Box Logo Tee", sellerKey: "streetvault", categorySlug: "streetwear", startingBid: 5600, currentBid: 7100, condition: "LIKE_NEW", size: "L", verified: true, hot: true, bidCount: 34, views: 156, watchers: 20, endHoursFromNow: 16 },
  { id: "seed-North Face Nuptse 1996", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUfGCc5Em8NdCeh1i0TzyU76Z4SLBtP9ODQmjc"], title: "North Face Nuptse 1996", sellerKey: "closet", categorySlug: "outerwear", startingBid: 8900, currentBid: 10500, condition: "EXCELLENT", size: "XL", verified: true, hot: true, bidCount: 47, views: 201, watchers: 24, endHoursFromNow: 5 },
  { id: "seed-Vintage Coach Shoulder Bag", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUTekyrxPH1DZegGoJyp3AI20LPlERFhB4X98K"], title: "Vintage Coach Shoulder Bag", sellerKey: "closet", categorySlug: "bags", startingBid: 6400, currentBid: 7800, condition: "GOOD", size: "One Size", verified: true, hot: false, bidCount: 19, views: 74, watchers: 8, endHoursFromNow: 71 },
  { id: "seed-Vintage Levis Trucker Jacket", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUiy7z6YCMrFu9bqTDdLX7BnyU1s3xI8aAep2R"], title: "Vintage Levi's Trucker Jacket", sellerKey: "closet", categorySlug: "vintage", startingBid: 4200, currentBid: 5100, condition: "GOOD", size: "M", verified: true, hot: true, bidCount: 15, views: 62, watchers: 9, endHoursFromNow: 35 },
  { id: "seed-Rayban-Wayfarer", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUVFHnF5t5cXpRtHoLiayrT8h2sgnuQzSBAExm"], title: "Ray-Ban Wayfarer Classic", sellerKey: "archive", categorySlug: "accessories", startingBid: 3200, currentBid: 3800, condition: "EXCELLENT", size: "One Size", verified: true, hot: false, bidCount: 11, views: 45, watchers: 6, endHoursFromNow: 95 },
  { id: "seed-APC-Petit-New-Standard", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsU1b0Q60lXpgPteoYNzChD2jZMVkLKv63ysnS4"], title: "APC Petit New Standard Selvedge", sellerKey: "streetvault", categorySlug: "denim", startingBid: 7800, currentBid: 8500, condition: "LIKE_NEW", size: "W30", verified: true, hot: false, bidCount: 8, views: 38, watchers: 4, endHoursFromNow: 143 },
  { id: "seed-Tiffany-Silver-Heart", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUXQhjMnyp3uBVe8midP79oGMXA2RkHJF6xfrb"], title: "Tiffany Silver Heart Tag Necklace", sellerKey: "closet", categorySlug: "jewelry", startingBid: 5500, currentBid: 6200, condition: "NEW", size: "One Size", verified: true, hot: true, bidCount: 22, views: 98, watchers: 14, endHoursFromNow: 29 },
  { id: "seed-NB-990v6", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUpJhBJgv1XCluO2W14MIgGbH07tQ63idAYz5v"], title: "New Balance 990v6 Grey", sellerKey: "archive", categorySlug: "sneakers", startingBid: 11200, currentBid: 12100, condition: "NEW", size: "UK 10", verified: true, hot: false, bidCount: 9, views: 52, watchers: 7, endHoursFromNow: 167 },
  { id: "seed-Carhartt-Detroit", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUDdi4zxEy2bS5eRWUXOQiv7ckpJoCzN60PuaK"], title: "Carhartt WIP Detroit Jacket", sellerKey: "streetvault", categorySlug: "streetwear", startingBid: 6800, currentBid: 7400, condition: "GOOD", size: "L", verified: true, hot: true, bidCount: 17, views: 83, watchers: 11, endHoursFromNow: 47 },
];

const REVIEW_LISTINGS = [
  { id: "seed-Vintage Fendi Baguette", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUXQhjMnyp3uBVe8midP79oGMXA2RkHJF6xfrb"], title: "Vintage Fendi Baguette", sellerKey: "archive", categorySlug: "bags", startingBid: 12800, currentBid: 12800, condition: "GOOD", size: "One Size", verified: true, hot: true, bidCount: 0, views: 234, watchers: 0 },
  { id: "seed-Chrome Hearts Ring", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUVFHnF5t5cXpRtHoLiayrT8h2sgnuQzSBAExm"], title: "Chrome Hearts Ring", sellerKey: "streetvault", categorySlug: "jewelry", startingBid: 7500, currentBid: 7500, condition: "NEW", size: "One Size", verified: true, hot: false, bidCount: 0, views: 112, watchers: 0 },
];

const PAST_LISTINGS = [
  { id: "seed-past-Levi's 501 Big E", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUiy7z6YCMrFu9bqTDdLX7BnyU1s3xI8aAep2R"], title: "Levi's 501 Big E", sellerKey: "closet", categorySlug: "denim", startingBid: 4800, currentBid: 6100, condition: "GOOD", size: "W32 L32", status: "ENDED" },
  { id: "seed-past-Louis Vuitton Pochette", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUrKksdhAYclFGm5PBtHi7oeZhU2VQk14Epyvd"], title: "Louis Vuitton Pochette", sellerKey: "closet", categorySlug: "bags", startingBid: 12500, currentBid: 15800, condition: "EXCELLENT", size: "One Size", status: "SOLD" },
  { id: "seed-past-Varsity Jacket", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsU1b0Q60lXpgPteoYNzChD2jZMVkLKv63ysnS4"], title: "90s Varsity Jacket", sellerKey: "streetvault", categorySlug: "outerwear", startingBid: 5200, currentBid: 6800, condition: "GOOD", size: "M", status: "SOLD" },
];

const UPCOMING_LISTINGS = [
  { id: "seed-up-Dior B23 Oblique", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUpJhBJgv1XCluO2W14MIgGbH07tQ63idAYz5v"], title: "Dior B23 Oblique High", sellerKey: "archive", categorySlug: "sneakers", startingBid: 9800, currentBid: 9800, condition: "EXCELLENT", size: "UK 8", verified: true, hot: true, startDaysFromNow: 2 },
  { id: "seed-up-Stone Island Cargo", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUDdi4zxEy2bS5eRWUXOQiv7ckpJoCzN60PuaK"], title: "Stone Island Cargo Pants", sellerKey: "streetvault", categorySlug: "streetwear", startingBid: 4300, currentBid: 4300, condition: "GOOD", size: "M", verified: true, hot: true, startDaysFromNow: 3 },
  { id: "seed-up-Balenciaga City Bag", images: ["https://ee7oisanmz.ufs.sh/f/NGE5n6g03KsUTekyrxPH1DZegGoJyp3AI20LPlERFhB4X98K"], title: "Balenciaga City Bag", sellerKey: "closet", categorySlug: "bags", startingBid: 8900, currentBid: 8900, condition: "GOOD", size: "One Size", verified: true, hot: false, startDaysFromNow: 4 },
];

type UpcomingVoteSeed = readonly [id: string, listingId: string, buyerKey: string];

const UPCOMING_VOTES: UpcomingVoteSeed[] = [
  ["seed-upvote-dior-alex", "seed-up-Dior B23 Oblique", "alex"],
  ["seed-upvote-dior-riya", "seed-up-Dior B23 Oblique", "riya"],
  ["seed-upvote-stone-alex", "seed-up-Stone Island Cargo", "alex"],
  ["seed-upvote-stone-kabir", "seed-up-Stone Island Cargo", "kabir"],
  ["seed-upvote-balenciaga-riya", "seed-up-Balenciaga City Bag", "riya"],
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
  ["seed-live-trucker-kabir", "seed-Vintage Levis Trucker Jacket", "kabir", 5100],
  ["seed-live-wayfarer-alex", "seed-Rayban-Wayfarer", "alex", 3800],
  ["seed-live-apc-riya", "seed-APC-Petit-New-Standard", "riya", 8500],
  ["seed-live-tiffany-kabir", "seed-Tiffany-Silver-Heart", "kabir", 6200],
  ["seed-live-nb-alex", "seed-NB-990v6", "alex", 12100],
  ["seed-live-carhartt-riya", "seed-Carhartt-Detroit", "riya", 7400],
];

const PAST_BIDS: DemoBid[] = [
  ["seed-past-bid-levi-alex", "seed-past-Levi's 501 Big E", "alex", 5600],
  ["seed-past-bid-levi-kabir", "seed-past-Levi's 501 Big E", "kabir", 6100],
  ["seed-past-bid-lv-riya", "seed-past-Louis Vuitton Pochette", "riya", 14800],
  ["seed-past-bid-lv-kabir", "seed-past-Louis Vuitton Pochette", "kabir", 15800],
  ["seed-past-bid-varsity-alex", "seed-past-Varsity Jacket", "alex", 6800],
  ["seed-past-bid-varsity-riya", "seed-past-Varsity Jacket", "riya", 6200],
];

async function upsertUser(data: { email: string; password: string; name: string; role: string; sellerStatus?: string; listingCredits?: number; freeListingsGranted?: boolean }) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      password: await bcrypt.hash(data.password, 10),
      role: data.role as any,
      sellerStatus: data.sellerStatus as any,
      listingCredits: data.listingCredits,
      freeListingsGranted: data.freeListingsGranted ?? false,
      isBanned: false,
    },
    create: {
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      name: data.name,
      role: data.role as any,
      sellerStatus: data.sellerStatus as any,
      listingCredits: data.listingCredits ?? 0,
      freeListingsGranted: data.freeListingsGranted ?? false,
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
    images?: string[];
    startsAt?: Date;
  },
  sellers: Record<string, { id: string }>,
  endsAt: Date,
) {
  return prisma.listing.upsert({
    where: { id: listing.id },
    update: {
      title: listing.title,
      ...(listing.images?.length ? { images: [...listing.images] } : {}),
      seller: { connect: { id: sellers[listing.sellerKey].id } },
      category: { connect: { slug: listing.categorySlug } },
      startingBid: listing.startingBid,
      currentBid: listing.currentBid,
      status: (listing.status ?? "ACTIVE") as any,
      upcomingIntent: listing.status === "UPCOMING",
      condition: listing.condition as any,
      size: listing.size,
      verified: listing.verified ?? false,
      hot: listing.hot ?? false,
      bidCount: listing.bidCount ?? 0,
      views: listing.views ?? 0,
      watchers: listing.watchers ?? 0,
      ...(listing.startsAt ? { startsAt: listing.startsAt } : {}),
      endsAt,
    },
    create: {
      id: listing.id,
      title: listing.title,
      images: listing.images ?? [],
      description: "Premium vintage piece, fully authenticated for demo purposes.",
      category: { connect: { slug: listing.categorySlug } },
      seller: { connect: { id: sellers[listing.sellerKey].id } },
      startingBid: listing.startingBid,
      currentBid: listing.currentBid,
      bidIncrement: 50,
      status: (listing.status ?? "ACTIVE") as any,
      upcomingIntent: listing.status === "UPCOMING",
      verified: listing.verified ?? false,
      hot: listing.hot ?? false,
      condition: listing.condition as any,
      size: listing.size,
      bidCount: listing.bidCount ?? 0,
      views: listing.views ?? 0,
      watchers: listing.watchers ?? 0,
      ...(listing.startsAt ? { startsAt: listing.startsAt } : {}),
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
      freeListingsGranted: true,
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

  const pastEndsAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  for (const listing of LIVE_LISTINGS) {
    const endsAt = new Date(Date.now() + (listing.endHoursFromNow ?? 24) * 60 * 60 * 1000);
    await upsertListing(listing, sellers, endsAt);
  }
  for (const listing of REVIEW_LISTINGS) await upsertListing({ ...listing, status: "PENDING_REVIEW" }, sellers, new Date(Date.now() + 24 * 60 * 60 * 1000));
  for (const listing of PAST_LISTINGS) await upsertListing(listing, sellers, pastEndsAt);
  for (const listing of UPCOMING_LISTINGS) {
    await upsertListing(
      {
        ...listing,
        status: "UPCOMING",
        startsAt: new Date(Date.now() + listing.startDaysFromNow * 24 * 60 * 60 * 1000),
      },
      sellers,
      new Date(Date.now() + (listing.startDaysFromNow + 2) * 24 * 60 * 60 * 1000),
    );
  }
  console.log(`Seeded ${LIVE_LISTINGS.length} live listings, ${REVIEW_LISTINGS.length} review listings, ${PAST_LISTINGS.length} past listings, and ${UPCOMING_LISTINGS.length} upcoming listings`);

  for (const [id, listingId, buyerKey, amount] of LIVE_BIDS) {
    await upsertBid(id, listingId, buyers[buyerKey].id, amount);
  }
  for (const [id, listingId, buyerKey, amount] of PAST_BIDS) {
    await upsertBid(id, listingId, buyers[buyerKey].id, amount);
  }

  for (const [id, listingId, buyerKey] of UPCOMING_VOTES) {
    await prisma.upcomingVote.upsert({
      where: { userId_listingId: { userId: buyers[buyerKey].id, listingId } },
      update: {},
      create: { id, userId: buyers[buyerKey].id, listingId },
    });
  }
  console.log(`Seeded ${UPCOMING_VOTES.length} upcoming vote(s)`);

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
