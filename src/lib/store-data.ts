import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getStoreBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.sellerProfile.findUnique({
      where: { storeSlug: slug },
      select: {
        storeName: true,
        storeDescription: true,
        location: true,
        returnPolicy: true,
        storeLogo: true,
        instagramUrl: true,
        userId: true,
        user: { select: { name: true, image: true, email: true } },
      },
    });
  },
  ["store-by-slug"],
  { revalidate: 30 },
);

export const getStoreListings = unstable_cache(
  async (sellerId: string) => {
    const rows = await prisma.listing.findMany({
      where: { sellerId, status: { in: ["ACTIVE", "UPCOMING"] } },
      orderBy: [{ listingMode: "asc" }, { featured: "desc" }, { createdAt: "desc" }],
      take: 40,
      select: {
        id: true,
        title: true,
        images: true,
        listingMode: true,
        startingBid: true,
        currentBid: true,
        buyNowPrice: true,
        size: true,
        status: true,
        endsAt: true,
        bidCount: true,
        verified: true,
        hot: true,
        featured: true,
        featuredUntil: true,
        category: { select: { slug: true, emoji: true, color: true } },
      },
    });
    const now = Date.now();
    return rows.map((r) => ({
      ...r,
      endsAt: r.endsAt.toISOString(),
      featuredUntil: r.featuredUntil?.toISOString() ?? null,
      isLive: r.status === "ACTIVE" && new Date(r.endsAt).getTime() > now,
    }));
  },
  ["store-listings"],
  { revalidate: 15 },
);

export function slugifyStoreName(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
  return base || "store";
}