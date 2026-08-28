import LiveDropLandingPage from "@/components/home/LiveDropLandingPage";
import LiveAuctionsStrip from "@/components/home/LiveAuctionsStrip";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Product } from "@/types";

export const revalidate = 0;

export default async function HomePage() {
  const now = new Date();
  const session = await auth();
  const [listings, upcoming] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", endsAt: { gt: now } },
      orderBy: [{ featured: "desc" }, { hot: "desc" }, { endsAt: "asc" }],
      take: 24,
      include: { category: true },
    }),
    prisma.listing.findMany({
      where: { status: "UPCOMING" },
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        category: true,
        seller: { select: { name: true, email: true } },
        _count: { select: { upcomingVotes: true } },
      },
    }),
  ]);
  const products: Product[] = listings.map((listing, index) => ({
    id: index + 1,
    listingId: listing.id,
    category: listing.category.slug as Product["category"],
    name: listing.title,
    emoji: listing.category.emoji,
    bg: listing.category.color,
    image: listing.images[0] ?? null,
    bid: listing.currentBid ?? listing.startingBid,
    time: Math.max(0, Math.floor((listing.endsAt.getTime() - Date.now()) / 1000)),
    bids: listing.bidCount,
    viewers: listing.views,
    verified: listing.verified,
    hot: listing.hot,
    featured: Boolean(listing.featuredUntil && listing.featuredUntil > now),
  }));

  const upcomingItems = await Promise.all(
    upcoming.map(async (l) => {
      const userVoted = session?.user
        ? (await prisma.upcomingVote.count({
            where: { listingId: l.id, userId: session.user.id },
          })) > 0
        : false;
      return {
        listingId: l.id,
        title: l.title,
        image: l.images[0] ?? null,
        emoji: l.category.emoji,
        bg: l.category.color,
        categorySlug: l.category.slug,
        sellerName: l.seller.name ?? l.seller.email,
        startsAtIso: l.startsAt ? l.startsAt.toISOString() : null,
        voteCount: l._count.upcomingVotes,
        userVoted,
        isSeller: session?.user ? session.user.id === l.sellerId : false,
        signedIn: !!session?.user,
      };
    }),
  );

  return (
    <>
      <LiveDropLandingPage products={products} upcomingItems={upcomingItems} />
      <LiveAuctionsStrip />
    </>
  );
}
