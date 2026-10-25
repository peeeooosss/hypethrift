import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MALL_ZONES, type ZoneSlug } from "./zones";

export interface MallProduct {
  id: string | null;
  title: string;
  price: number;
  image: string | null;
  mode: "AUCTION" | "RETAIL" | "BOTH";
  emoji: string;
  color: string;
  size: string | null;
  meta: string;
  zone: ZoneSlug;
  preview?: boolean;
}

export type MallShowcase = Record<ZoneSlug, MallProduct[]>;

function previewProducts(zone: ZoneSlug): MallProduct[] {
  const data = MALL_ZONES.find((item) => item.slug === zone)!;
  return data.products.map((title, index) => ({
    id: null,
    title,
    price: [1499, 2499, 3999, 4999][index] ?? 1999,
    image: null,
    mode: "RETAIL",
    emoji: data.emoji,
    color: data.color,
    size: null,
    meta: "Preview · shop the zone",
    zone,
    preview: true,
  }));
}

export const getMallShowcase = unstable_cache(
  async (): Promise<MallShowcase> => {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE", endsAt: { gt: new Date() } },
      orderBy: [{ featured: "desc" }, { hot: "desc" }, { endsAt: "asc" }],
      take: 160,
      select: {
        id: true,
        title: true,
        images: true,
        listingMode: true,
        currentBid: true,
        startingBid: true,
        buyNowPrice: true,
        size: true,
        bidCount: true,
        endsAt: true,
        category: { select: { slug: true, emoji: true, color: true } },
      },
    });

    const grouped = Object.fromEntries(MALL_ZONES.map((zone) => [zone.slug, [] as MallProduct[]])) as MallShowcase;

    for (const listing of listings) {
      const slug = listing.category.slug as ZoneSlug;
      if (!grouped[slug] || grouped[slug].length >= 4) continue;
      grouped[slug].push({
        id: listing.id,
        title: listing.title,
        price: listing.buyNowPrice ?? listing.currentBid ?? listing.startingBid,
        image: listing.images[0] ?? null,
        mode: listing.listingMode,
        emoji: listing.category.emoji,
        color: listing.category.color,
        size: listing.size,
        meta:
          listing.listingMode === "AUCTION"
            ? `${listing.bidCount} bids · live`
            : listing.listingMode === "BOTH"
              ? "Bid or buy now"
              : "Buy now",
        zone: slug,
      });
    }

    for (const zone of MALL_ZONES) {
      if (grouped[zone.slug].length === 0) grouped[zone.slug] = previewProducts(zone.slug);
    }

    return grouped;
  },
  ["mall-showcase-v1"],
  { revalidate: 20 },
);

export async function getZoneListings(zone: string, take = 24) {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      endsAt: { gt: new Date() },
      category: { slug: zone },
    },
    orderBy: [{ featured: "desc" }, { hot: "desc" }, { endsAt: "asc" }],
    take,
    include: { category: true, seller: { include: { sellerProfile: true } } },
  });
}
