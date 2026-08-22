import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SizeFilter from "@/components/listing/SizeFilter";

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
  const where = {
    status: "ACTIVE" as const,
    endsAt: { gt: new Date() },
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
    ...(effectiveCat && { category: { slug: effectiveCat } }),
    ...(selectedSizes.length > 0 && { size: { in: selectedSizes } }),
  };

  const [listings, categories] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { slug: { not: "all" } }, orderBy: { name: "asc" } }),
  ]);

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

        {effectiveCat && <SizeFilter categorySlug={effectiveCat} />}

        {listings.length === 0 ? (
          <p className="font-bold text-gray-500 uppercase">No live auctions right now.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((l) => {
              const mins = (new Date(l.endsAt).getTime() - Date.now()) / (1000 * 60);
              return (
                <Link key={l.id} href={`/listing/${encodeURIComponent(l.id)}`} className="group">
                  <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 aspect-[4/5] flex flex-col">
                    <div className="flex-1 flex items-center justify-center text-5xl mb-3">{l.category.emoji}</div>
                    <h3 className="font-black text-sm uppercase text-center mb-2 line-clamp-2">{l.title}</h3>
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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
