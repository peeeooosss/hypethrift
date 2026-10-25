import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRANDS, getBrand } from "@/data/brands";
import { prisma } from "@/lib/prisma";
import { ListingCard, type ListingCardData } from "@/components/commerce/ListingCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const brand = getBrand((await params).slug);
  if (!brand) return { title: "Brand not found" };
  return {
    title: brand.name,
    description: `${brand.tagline} Shop authenticated ${brand.name} pieces on HypeThrift.`,
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const brand = getBrand((await params).slug);
  if (!brand) notFound();

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      endsAt: { gt: new Date() },
      OR: [
        { title: { contains: brand.name, mode: "insensitive" } },
        { description: { contains: brand.name, mode: "insensitive" } },
      ],
    },
    orderBy: [{ featured: "desc" }, { endsAt: "asc" }],
    take: 12,
    include: { category: true, seller: { include: { sellerProfile: true } } },
  });

  const cards: ListingCardData[] = listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    image: listing.images[0] ?? null,
    emoji: listing.category.emoji,
    accent: listing.category.color,
    price: listing.buyNowPrice ?? listing.currentBid ?? listing.startingBid,
    mode: listing.listingMode,
    meta: listing.listingMode === "AUCTION" ? `${listing.bidCount} bids · live` : listing.listingMode === "BOTH" ? "Bid or buy now" : "Buy now",
    size: listing.size,
    zone: listing.category.name,
    featured: listing.featured,
  }));

  const related = BRANDS.filter((item) => item.tier === brand.tier && item.slug !== brand.slug).slice(0, 6);

  return (
    <div className="bg-cream pb-20">
      <section className="border-b-2 border-ink" style={{ backgroundColor: brand.accent }}>
        <div className="container-page py-12 md:py-16">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Link href="/brands" className="underline">Brands</Link>
            <span>/</span>
            <span>{brand.tier}</span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h1 className="font-display text-6xl uppercase leading-[0.84] md:text-8xl">{brand.name}</h1>
              <p className="mt-4 max-w-xl text-sm font-bold leading-relaxed text-ink/60">{brand.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="ink">{brand.tier}</Badge>
              <Badge tone="lilac">{brand.category}</Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">On the floor now</p>
            <h2 className="font-display text-3xl uppercase">{brand.name} pieces</h2>
          </div>
          <Link href={`/listings?mode=auction&q=${encodeURIComponent(brand.name)}`} className="rounded-full border-2 border-ink bg-white px-4 py-2 text-[10px] font-black uppercase">
            View in shop
          </Link>
        </div>

        {cards.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-[2rem] border-2 border-ink bg-white p-10 text-center shadow-brut-md">
            <p className="text-6xl">🧲</p>
            <h3 className="mt-3 font-display text-3xl uppercase">No {brand.name} on the rail</h3>
            <p className="mt-2 text-sm font-bold text-ink/50">Be the first to list it. The mall is waiting.</p>
            <Link href="/sell" className="mt-5 inline-flex rounded-full border-2 border-ink bg-acid px-5 py-3 text-xs font-black uppercase">Sell {brand.name}</Link>
          </div>
        )}

        <section className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="label">More from {brand.tier}</p>
              <h2 className="font-display text-3xl uppercase">Same energy</h2>
            </div>
            <Link href={`/brands?tier=${encodeURIComponent(brand.tier)}`} className="text-[10px] font-black uppercase underline">See all</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((item) => (
              <Link key={item.slug} href={`/brands/${item.slug}`} className={cn("rounded-xl border-2 border-ink p-3 text-center shadow-brut-xs transition-transform hover:-translate-y-0.5")} style={{ backgroundColor: item.accent }}>
                <span className="font-display text-sm uppercase leading-tight">{item.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
