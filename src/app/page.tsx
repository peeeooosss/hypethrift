import LiveDropLandingPage from "@/components/home/LiveDropLandingPage";
import LiveAuctionsStrip from "@/components/home/LiveAuctionsStrip";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types";

export const revalidate = 0;

export default async function HomePage() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: [{ featured: "desc" }, { hot: "desc" }, { endsAt: "asc" }],
    take: 24,
    include: { category: true },
  });
  const products: Product[] = listings.map((listing, index) => ({
    id: index + 1,
    listingId: listing.id,
    category: listing.category.slug as Product["category"],
    name: listing.title,
    emoji: listing.category.emoji,
    bg: listing.category.color,
    bid: listing.currentBid ?? listing.startingBid,
    time: Math.max(0, Math.floor((listing.endsAt.getTime() - Date.now()) / 1000)),
    bids: listing.bidCount,
    viewers: listing.views,
    verified: listing.verified,
    hot: listing.hot,
  }));

  return (
    <>
      <LiveDropLandingPage products={products} />
      <LiveAuctionsStrip />
    </>
  );
}
