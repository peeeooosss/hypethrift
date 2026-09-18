import LiveDropLandingPage from "@/components/home/LiveDropLandingPage";
import LiveAuctionsStrip from "@/components/home/LiveAuctionsStrip";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getHomepageListings, getHomepageUpcoming } from "@/lib/public-data";
import type { Product } from "@/types";

export const revalidate = 0;

export default async function HomePage() {
  const now = new Date();
  const session = await auth();
  const [listings, upcoming, upcomingVotes, savedListings] = await Promise.all([
    getHomepageListings(),
    getHomepageUpcoming(),
    session?.user
      ? prisma.upcomingVote.findMany({ where: { userId: session.user.id }, select: { listingId: true } })
      : Promise.resolve([]),
    session?.user
      ? prisma.savedItem.findMany({ where: { userId: session.user.id }, select: { listingId: true } })
      : Promise.resolve([]),
  ]);
  const upcomingVoteIds = new Set(upcomingVotes.map((vote) => vote.listingId));
  const savedListingIds = new Set(savedListings.map((item) => item.listingId));
  const products: Product[] = listings.map((listing, index) => ({
    id: index + 1,
    listingId: listing.id,
    listingMode: listing.listingMode,
    buyNowPrice: listing.buyNowPrice,
    category: listing.category.slug as Product["category"],
    name: listing.title,
    emoji: listing.category.emoji,
    bg: listing.category.color,
    image: listing.images[0] ?? null,
    bid: listing.currentBid ?? listing.startingBid,
    time: Math.max(0, Math.floor((new Date(listing.endsAt).getTime() - Date.now()) / 1000)),
    bids: listing.bidCount,
    viewers: listing.views,
    verified: listing.verified,
    hot: listing.hot,
    featured: Boolean(listing.featuredUntil && new Date(listing.featuredUntil) > now),
  }));

  const auctionProducts = products.filter((p) => p.listingMode === "AUCTION" || p.listingMode === "BOTH");
  const retailProducts = products.filter((p) => p.listingMode === "RETAIL" || p.listingMode === "BOTH");

  const upcomingItems = upcoming.map((l) => ({
    listingId: l.id,
    title: l.title,
    image: l.images[0] ?? null,
    emoji: l.category.emoji,
    bg: l.category.color,
    categorySlug: l.category.slug,
    sellerName: l.seller.name ?? l.seller.email,
    startsAtIso: l.startsAt,
    voteCount: l._count.upcomingVotes,
    userVoted: upcomingVoteIds.has(l.id),
    isSeller: session?.user ? session.user.id === l.sellerId : false,
    signedIn: !!session?.user,
  }));

  const stripListings = [...listings]
    .sort((a, b) => (b.currentBid ?? b.startingBid) - (a.currentBid ?? a.startingBid))
    .slice(0, 6);

  return (
    <>
      <LiveDropLandingPage products={products} upcomingItems={upcomingItems} />
      <LiveAuctionsStrip listings={stripListings} savedIds={savedListingIds} signedIn={!!session?.user} />
    </>
  );
}
