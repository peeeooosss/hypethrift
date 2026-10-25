import type { Metadata } from "next";
import Link from "next/link";
import { MallTopBar } from "@/components/mall/MallTopBar";
import { ListingCard, type ListingCardData } from "@/components/commerce/ListingCard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { getLiveCount } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Bid Arena",
  description: "Enter the HypeThrift Bid Arena. Live auctions, upcoming drops and one-of-one grails.",
};

export const revalidate = 0;

export default async function BidArenaPage() {
  const [auctions, upcoming, liveCount] = await Promise.all([
    prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        listingMode: { in: ["AUCTION", "BOTH"] },
        endsAt: { gt: new Date() },
      },
      orderBy: [{ featured: "desc" }, { endsAt: "asc" }],
      take: 16,
      include: { category: true },
    }),
    prisma.listing.findMany({
      where: { status: "UPCOMING" },
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: 6,
      include: { category: true },
    }),
    getLiveCount(),
  ]);

  const cards: ListingCardData[] = auctions.map((listing) => ({
    id: listing.id,
    title: listing.title,
    image: listing.images[0] ?? null,
    emoji: listing.category.emoji,
    accent: listing.category.color,
    price: listing.currentBid ?? listing.startingBid,
    mode: listing.listingMode,
    meta: `${listing.bidCount} bids · ends soon`,
    size: listing.size,
    zone: listing.category.name,
    featured: listing.featured,
  }));

  return (
    <div className="min-h-screen bg-ink text-white">
      <MallTopBar backLabel="Back to mall" />
      <section className="relative overflow-hidden border-b-2 border-white/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,102,178,0.32),transparent_42%),radial-gradient(circle_at_78%_70%,rgba(212,255,51,0.18),transparent_35%)]" />
        <div className="container-page relative py-16 md:py-24">
          <Badge tone="acid">{liveCount} live right now</Badge>
          <h1 className="mt-5 font-display text-6xl uppercase leading-[0.85] text-acid md:text-8xl lg:text-9xl">
            Bid<br />Arena
          </h1>
          <p className="mt-5 max-w-xl text-base font-bold leading-relaxed text-white/60">
            The loudest room in the mall. Watch the clock, raise the bid and take the grail home. No secret reserves, no soft landings.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border-2 border-white bg-white px-6 py-3 text-sm font-black uppercase text-ink shadow-brut-acid">
              Walk the mall ↗
            </Link>
            <Link href="/listings?mode=auction" className="rounded-full border-2 border-white px-6 py-3 text-sm font-black uppercase text-white">
              Browse all auctions
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="label !text-white/35">On the floor</p>
            <h2 className="font-display text-3xl uppercase text-white md:text-4xl">Live lots</h2>
          </div>
          <span className="flex items-center gap-2 text-[10px] font-black uppercase text-acid">
            <span className="h-2 w-2 animate-pulse-live rounded-full bg-acid" /> Bidding open
          </span>
        </div>
        {cards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-white/30 bg-white/5 p-10 text-center">
            <p className="text-5xl">🎤</p>
            <h3 className="mt-3 font-display text-2xl uppercase text-white">The floor is warming up</h3>
            <p className="mt-2 text-sm font-bold text-white/50">Request a drop below or check back when the next auction goes live.</p>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="border-t-2 border-white/15 bg-white/[0.03]">
          <div className="container-page py-10">
            <p className="label !text-white/35">Next on the block</p>
            <h2 className="font-display text-3xl uppercase text-white">Upcoming drops</h2>
            <div className="mt-6 space-y-3">
              {upcoming.map((listing) => (
                <Link key={listing.id} href={`/listing/${listing.id}`} className="flex items-center gap-4 rounded-2xl border-2 border-white/20 bg-white/5 p-4 transition-colors hover:border-acid">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-white/30 text-2xl" style={{ backgroundColor: listing.category.color }}>
                    {listing.category.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black uppercase text-white">{listing.title}</p>
                    <p className="text-[10px] font-bold uppercase text-white/40">
                      {listing.startsAt ? `Starts ${new Date(listing.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Date to be announced"}
                    </p>
                  </div>
                  <span className="text-acid">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
