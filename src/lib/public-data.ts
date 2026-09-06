import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getLiveCount = unstable_cache(
  async () => prisma.listing.count({ where: { status: "ACTIVE", endsAt: { gt: new Date() } } }),
  ["public-live-count"],
  { revalidate: 15 },
);

export const getHomepageListings = unstable_cache(
  async () => prisma.listing.findMany({
    where: { status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: [{ featured: "desc" }, { hot: "desc" }, { endsAt: "asc" }],
    take: 24,
    select: {
      id: true,
      title: true,
      images: true,
      currentBid: true,
      startingBid: true,
      size: true,
      endsAt: true,
      bidCount: true,
      views: true,
      verified: true,
      hot: true,
      featured: true,
      featuredUntil: true,
      category: { select: { slug: true, emoji: true, color: true } },
    },
  }),
  ["homepage-active-listings"],
  { revalidate: 10 },
);

export const getHomepageUpcoming = unstable_cache(
  async () => prisma.listing.findMany({
    where: { status: "UPCOMING" },
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    take: 12,
    select: {
      id: true,
      title: true,
      images: true,
      startsAt: true,
      sellerId: true,
      category: { select: { slug: true, emoji: true, color: true } },
      seller: { select: { name: true, email: true } },
      _count: { select: { upcomingVotes: true } },
    },
  }),
  ["homepage-upcoming-listings"],
  { revalidate: 20 },
);
