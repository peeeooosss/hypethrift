import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { prisma, enums } from "@/lib/prisma";
import type { ListingMode } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ListingCard, type ListingCardData } from "@/components/commerce/ListingCard";
import UpcomingSection, { type UpcomingItem } from "@/components/home/UpcomingSection";
import { getSizesForCategory } from "@/lib/sizes";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop live auctions and Buy Now thrift finds across sneakers, streetwear, vintage, denim, bags and jewelry.",
};

export const revalidate = 0;

type Mode = "auction" | "retail";

function modeFilter(mode: Mode) {
  return mode === "retail"
    ? { listingMode: { in: ["RETAIL", "BOTH"] as ListingMode[] }, buyNowPrice: { not: null } }
    : { listingMode: { in: ["AUCTION", "BOTH"] as ListingMode[] } };
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    sizes?: string;
    mode?: string;
    sort?: string;
    brand?: string;
  }>;
}) {
  const params = await searchParams;
  const mode: Mode = params.mode === "retail" ? "retail" : "auction";
  const q = params.q?.trim() ?? "";
  const cat = params.cat && params.cat !== "all" ? params.cat : "";
  const brand = params.brand?.trim() ?? "";
  const selectedSizes = params.sizes ? params.sizes.split(",").filter(Boolean) : [];
  const sort = params.sort ?? "ending";

  const orderBy =
    sort === "newest"
      ? [{ createdAt: "desc" as const }]
      : sort === "price-low"
        ? [{ buyNowPrice: "asc" as const }, { startingBid: "asc" as const }]
        : sort === "price-high"
          ? [{ buyNowPrice: "desc" as const }, { startingBid: "desc" as const }]
          : sort === "bids"
            ? [{ bidCount: "desc" as const }]
            : [{ featured: "desc" as const }, { endsAt: "asc" as const }];

  const where = {
    status: "ACTIVE" as const,
    endsAt: { gt: new Date() },
    ...modeFilter(mode),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            ...(brand ? [{ title: { contains: brand, mode: "insensitive" as const } }] : []),
          ],
        }
      : brand
        ? { title: { contains: brand, mode: "insensitive" as const } }
        : {}),
    ...(cat && { category: { slug: cat } }),
    ...(selectedSizes.length > 0 && { size: { in: selectedSizes } }),
  };

  const session = await auth();
  const [listings, categories, upcoming, upcomingVotes, sizeRows] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      take: 32,
      include: { category: true, seller: { include: { sellerProfile: true } } },
    }),
    prisma.category.findMany({ where: { slug: { not: "all" } }, orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: { status: "UPCOMING", ...modeFilter(mode) },
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        category: true,
        seller: { select: { name: true, email: true } },
        _count: { select: { upcomingVotes: true } },
      },
    }),
    session
      ? prisma.upcomingVote.findMany({ where: { userId: session.user.id }, select: { listingId: true } })
      : Promise.resolve([]),
    prisma.listing.findMany({ where, select: { size: true }, distinct: ["size"] }),
  ]);

  const upcomingItems: UpcomingItem[] = upcoming.map((listing) => ({
    listingId: listing.id,
    title: listing.title,
    image: listing.images[0] ?? null,
    emoji: listing.category.emoji,
    bg: listing.category.color,
    categorySlug: listing.category.slug,
    sellerName: listing.seller.name ?? listing.seller.email,
    startsAtIso: listing.startsAt?.toISOString() ?? null,
    voteCount: listing._count.upcomingVotes,
    userVoted: upcomingVotes.some((vote) => vote.listingId === listing.id),
    isSeller: session?.user ? session.user.id === listing.sellerId : false,
    signedIn: !!session?.user,
  }));

  const activeCategory = categories.find((category) => category.slug === cat);
  const availableSizes = getSizesForCategory(cat).filter((size) =>
    new Set(sizeRows.map((row) => row.size).filter(Boolean)).has(size),
  );

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
    zone: listing.category.name,
    featured: listing.featured,
  }));

  const tabHref = (nextMode: Mode) => {
    const next = new URLSearchParams();
    next.set("mode", nextMode);
    if (q) next.set("q", q);
    if (cat) next.set("cat", cat);
    if (brand) next.set("brand", brand);
    if (selectedSizes.length) next.set("sizes", selectedSizes.join(","));
    if (sort !== "ending") next.set("sort", sort);
    return `/listings?${next.toString()}`;
  };

  return (
    <div className="bg-cream pb-20">
      <section className="border-b-2 border-ink bg-ink text-white">
        <div className="container-page py-12 md:py-16">
          <Badge tone="acid">The shop floor</Badge>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h1 className="font-display text-5xl uppercase leading-[0.88] md:text-7xl">
                {mode === "auction" ? "Live on the block." : "Buy it. Own it. Flex."}
              </h1>
              <p className="mt-4 max-w-xl text-sm font-bold leading-relaxed text-white/55">
                {mode === "auction"
                  ? "One-of-one pieces with a clock on them. Raise your bid before the room moves on."
                  : "No waiting, no bidding. Add to your bag and check out directly with the seller."}
              </p>
            </div>
            <div className="flex rounded-full border-2 border-white bg-white/10 p-1">
              <Link href={tabHref("auction")} className={cn("rounded-full px-5 py-2.5 text-xs font-black uppercase", mode === "auction" ? "bg-acid text-ink" : "text-white/60")}>
                Auction
              </Link>
              <Link href={tabHref("retail")} className={cn("rounded-full px-5 py-2.5 text-xs font-black uppercase", mode === "retail" ? "bg-bubblegum text-ink" : "text-white/60")}>
                Buy now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-6">
        <form action="/listings" className="grid gap-2 rounded-3xl border-2 border-ink bg-white p-2 shadow-brut-md sm:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="mode" value={mode} />
          <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/15 bg-cream px-4">
            <Search className="h-4 w-4" />
            <input name="q" defaultValue={q} placeholder="Search title, description, brand..." className="w-full bg-transparent py-3 text-sm font-bold outline-none placeholder:text-ink/35" />
          </div>
          <select name="sort" defaultValue={sort} className="rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-xs font-black uppercase outline-none">
            <option value="ending">Ending soon</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price low</option>
            <option value="price-high">Price high</option>
            <option value="bids">Most bids</option>
          </select>
          <button className="rounded-2xl border-2 border-ink bg-ink px-6 py-3 text-xs font-black uppercase text-white">
            Apply
          </button>
          {cat && <input type="hidden" name="cat" value={cat} />}
          {selectedSizes.length > 0 && <input type="hidden" name="sizes" value={selectedSizes.join(",")} />}
        </form>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="label">{activeCategory ? activeCategory.name : "All zones"}</span>
          </div>
          <span className="text-[10px] font-black uppercase text-ink/40">{listings.length} pieces</span>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <Link
            href={`/listings?mode=${mode}${q ? `&q=${encodeURIComponent(q)}` : ""}${sort !== "ending" ? `&sort=${sort}` : ""}`}
            className={cn("shrink-0 rounded-full border-2 border-ink px-4 py-2 text-[10px] font-black uppercase", !cat ? "bg-ink text-white" : "bg-white")}
          >
            All
          </Link>
          {categories.map((category) => {
            const next = new URLSearchParams({ mode, cat: category.slug });
            if (q) next.set("q", q);
            if (sort !== "ending") next.set("sort", sort);
            return (
              <Link
                key={category.id}
                href={`/listings?${next.toString()}`}
                className={cn("shrink-0 rounded-full border-2 border-ink px-4 py-2 text-[10px] font-black uppercase", cat === category.slug ? "bg-ink text-white" : "bg-white")}
              >
                {category.emoji} {category.name}
              </Link>
            );
          })}
        </div>

        {availableSizes.length > 0 && (
          <div className="mt-3">
            <p className="label mb-2">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const active = selectedSizes.includes(size);
                const nextSizes = active ? selectedSizes.filter((item) => item !== size) : [...selectedSizes, size];
                const next = new URLSearchParams({ mode, cat });
                if (q) next.set("q", q);
                if (nextSizes.length) next.set("sizes", nextSizes.join(","));
                if (sort !== "ending") next.set("sort", sort);
                return (
                  <Link key={size} href={`/listings?${next.toString()}`} className={cn("rounded-full border-2 border-ink px-3 py-1.5 text-[10px] font-black uppercase", active ? "bg-aqua" : "bg-white")}>
                    {size}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {brand && (
          <div className="mt-4 flex items-center gap-2">
            <Badge tone="lilac">Brand: {brand}</Badge>
            <Link href={`/listings?mode=${mode}`} className="text-[10px] font-black uppercase underline">Clear</Link>
          </div>
        )}

        {cards.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[2rem] border-2 border-ink bg-white p-10 text-center shadow-brut-md">
            <p className="text-6xl">🕳️</p>
            <h2 className="mt-3 font-display text-3xl uppercase">Nothing on this rail yet</h2>
            <p className="mt-2 text-sm font-bold text-ink/50">Try a different zone, clear the filters or check the upcoming drops.</p>
            <Link href={`/listings?mode=${mode}`} className="mt-5 inline-flex rounded-full border-2 border-ink bg-acid px-5 py-3 text-xs font-black uppercase">
              Clear filters
            </Link>
          </div>
        )}
      </div>

      {upcomingItems.length > 0 && (
        <div className="container-page">
          <UpcomingSection items={upcomingItems} />
        </div>
      )}
    </div>
  );
}
