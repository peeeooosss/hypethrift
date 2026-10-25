import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MallTopBar } from "@/components/mall/MallTopBar";
import { ListingCard, type ListingCardData } from "@/components/commerce/ListingCard";
import { getZoneListings, getMallShowcase } from "@/lib/mall/showcase";
import { isZoneSlug, MALL_ZONES, ZONE_BY_SLUG } from "@/lib/mall/zones";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/utils";

export const revalidate = 20;

export async function generateMetadata({ params }: { params: Promise<{ zone: string }> }): Promise<Metadata> {
  const { zone } = await params;
  if (!isZoneSlug(zone)) return { title: "Mall zone" };
  const data = ZONE_BY_SLUG[zone];
  return { title: data.name, description: data.description };
}

export default async function ZonePage({ params }: { params: Promise<{ zone: string }> }) {
  const { zone } = await params;
  if (!isZoneSlug(zone)) notFound();
  const data = ZONE_BY_SLUG[zone];
  const [listings, showcase] = await Promise.all([getZoneListings(zone), getMallShowcase()]);

  const cards: ListingCardData[] = listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    image: listing.images[0] ?? null,
    emoji: listing.category.emoji,
    accent: listing.category.color,
    price: listing.buyNowPrice ?? listing.currentBid ?? listing.startingBid,
    mode: listing.listingMode,
    meta:
      listing.listingMode === "AUCTION"
        ? `${listing.bidCount} bids · live`
        : listing.listingMode === "BOTH"
          ? "Bid or buy now"
          : "Buy now",
    size: listing.size,
    zone: data.shortName,
    featured: listing.featured,
  }));

  return (
    <div className="min-h-screen bg-cream">
      <MallTopBar backLabel="Back to directory" backHref="/mall" />
      <section className="relative overflow-hidden border-b-2 border-ink" style={{ backgroundColor: data.color }}>
        <div className="absolute inset-0 opacity-10 mall-grid" />
        <div className="container-page relative py-12 md:py-20">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="ink">Zone</Badge>
            <Badge tone="white">{listings.length} active listings</Badge>
          </div>
          <div className="mt-5 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.9] md:text-7xl">{data.name}</h1>
              <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-ink/65">{data.description}</p>
            </div>
            <span className="text-8xl md:text-9xl">{data.emoji}</span>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {data.products.map((product) => (
              <span key={product} className="rounded-full border-2 border-ink bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase">
                {product}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        {cards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div>
            <div className="rounded-3xl border-2 border-dashed border-ink/25 bg-white/60 p-6 text-center">
              <p className="text-4xl">{data.emoji}</p>
              <h2 className="mt-2 font-display text-2xl uppercase">The racks are being restocked</h2>
              <p className="mt-1 text-sm font-bold text-ink/50">Preview the kind of pieces landing here next.</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {showcase[zone].map((product) => (
                <div key={product.title} className="rounded-3xl border-2 border-ink bg-white p-5 shadow-brut-sm">
                  <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border-2 border-ink" style={{ backgroundColor: data.color }}>
                    <span className="text-5xl">{data.emoji}</span>
                  </div>
                  <p className="mt-3 text-sm font-black uppercase">{product.title}</p>
                  <p className="mt-1 font-mono text-xs font-bold text-ink/45">{money(product.price)}</p>
                  <Link href={`/listings?cat=${zone}`} className="mt-3 inline-block text-[10px] font-black uppercase underline">
                    Shop similar ↗
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="container-page pb-14">
        <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-brut-md">
          <p className="label">Keep exploring</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MALL_ZONES.filter((item) => item.slug !== zone).map((item) => (
              <Link
                key={item.slug}
                href={`/mall/${item.slug}`}
                className="rounded-full border-2 border-ink px-4 py-2 text-[10px] font-black uppercase transition-colors hover:bg-ink hover:text-white"
              >
                {item.emoji} {item.shortName}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
