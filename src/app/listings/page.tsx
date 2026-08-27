import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import SizeFilter from "@/components/listing/SizeFilter";
import SaveButton from "@/components/listing/SaveButton";
import UpcomingSection, { type UpcomingItem } from "@/components/home/UpcomingSection";
import { getSizesForCategory } from "@/lib/sizes";

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

function endsIn(minutes: number) {
  if (minutes <= 0) return "Ended";
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.floor(minutes % 60)}m`;
}

export const revalidate = 0;

export default async function ListingsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sizes?: string }>;
}) {
  const { q, cat, sizes: sizesParam } = await searchParams;
  const selectedSizes = sizesParam ? sizesParam.split(",").filter(Boolean) : [];
  const effectiveCat = cat && cat !== "all" ? cat : "";
  const categoryWhere = {
    status: "ACTIVE" as const,
    endsAt: { gt: new Date() },
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
    ...(effectiveCat && { category: { slug: effectiveCat } }),
  };
  const where = {
    ...categoryWhere,
    ...(selectedSizes.length > 0 && { size: { in: selectedSizes } }),
  };
  const upcomingWhere = {
    status: "UPCOMING" as const,
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
    ...(effectiveCat && { category: { slug: effectiveCat } }),
    ...(selectedSizes.length > 0 && { size: { in: selectedSizes } }),
  };

  const session = await auth();
  const [listings, categories, savedIds, sizeRows, upcoming] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { slug: { not: "all" } }, orderBy: { name: "asc" } }),
    session
      ? prisma.savedItem
          .findMany({ where: { userId: session.user.id }, select: { listingId: true } })
          .then((r) => new Set(r.map((x) => x.listingId)))
      : Promise.resolve(new Set<string>()),
    prisma.listing.findMany({ where: categoryWhere, select: { size: true }, distinct: ["size"] }),
    prisma.listing.findMany({
      where: upcomingWhere,
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
        seller: { select: { name: true, email: true } },
        _count: { select: { upcomingVotes: true } },
      },
    }),
  ]);
  const configuredSizes = getSizesForCategory(effectiveCat);
  const listedSizes = new Set(sizeRows.map((row) => row.size).filter((size): size is string => !!size));
  const availableSizes = configuredSizes.filter((size) => listedSizes.has(size));
  const upcomingItems: UpcomingItem[] = await Promise.all(
    upcoming.map(async (l) => ({
      listingId: l.id,
      title: l.title,
      image: l.images[0] ?? null,
      emoji: l.category.emoji,
      bg: l.category.color,
      sellerName: l.seller.name ?? l.seller.email,
      startsAtIso: l.startsAt?.toISOString() ?? null,
      voteCount: l._count.upcomingVotes,
      userVoted: session?.user
        ? (await prisma.upcomingVote.count({ where: { listingId: l.id, userId: session.user.id } })) > 0
        : false,
      isSeller: session?.user ? session.user.id === l.sellerId : false,
      signedIn: !!session?.user,
    })),
  );

  return (
    <div className="min-h-screen bg-cream text-ink py-10 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-black uppercase mb-8">Live Auctions</h1>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/listings"
              className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-ink ${
                !effectiveCat ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/listings?cat=${c.slug}${selectedSizes.length ? `&sizes=${selectedSizes.join(",")}` : ""}`}
                className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-ink ${
                  effectiveCat === c.slug ? "bg-ink text-white" : "bg-white text-ink"
                }`}
              >
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </div>

        {effectiveCat && <SizeFilter categorySlug={effectiveCat} availableSizes={availableSizes} />}

        {listings.length === 0 ? (
          <p className="font-bold text-gray-500 uppercase">No live auctions right now. See the upcoming showcase below.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listings.map((l) => {
               const mins = (new Date(l.endsAt).getTime() - Date.now()) / (1000 * 60);
               return (
                 <div key={l.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 aspect-[4/5] flex flex-col relative">
                {session?.user && (
                  <div className="absolute top-2 right-2 z-10">
                    <SaveButton listingId={l.id} initiallySaved={savedIds.has(l.id)} size="sm" />
                  </div>
                )}
                   <Link href={`/listing/${encodeURIComponent(l.id)}`} className="group">
                     <div className="flex-1 flex items-center justify-center text-5xl mb-3">{l.category.emoji}</div>
                     <h3 className="font-black text-sm uppercase text-center mb-2 line-clamp-2">{l.title}</h3>
                   </Link>
                   <div className="text-center">
                     <span className="font-black block text-lg">{money(l.currentBid ?? l.startingBid)}</span>
                     <span className="text-xs uppercase font-black text-gray-500">
                       {l.bidCount} bids · {endsIn(mins)} left
                     </span>
                   </div>
                   {l.size && (
                     <div className="mt-2 text-center">
                       <span className="text-xs font-black uppercase bg-ink/5 border border-ink/20 rounded-full py-1 px-2">{l.size}</span>
                     </div>
                   )}
                 </div>
              );
            })}
          </div>
        )}
        {upcomingItems.length > 0 && <UpcomingSection items={upcomingItems} />}
      </div>
    </div>
  );
}
