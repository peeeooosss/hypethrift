import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getStoreBySlug, getStoreListings } from "@/lib/store-data";

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

function endsIn(minutes: number) {
  if (minutes <= 0) return "Ended";
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.floor(minutes % 60)}m`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "Store not found" };
  return {
    title: `${store.storeName} — Store`,
    description: store.storeDescription ?? undefined,
  };
}

export const revalidate = 0;

export default async function StorefrontPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const listings = await getStoreListings(store.userId);
  const live = listings.filter((l) => l.isLive);
  const upcoming = listings.filter((l) => !l.isLive && l.status === "UPCOMING");
  const display = [...live, ...upcoming];

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4">
            {store.storeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.storeLogo}
                alt={`${store.storeName} logo`}
                width={88}
                height={88}
                className="w-[88px] h-[88px] rounded-2xl border-2 border-cream/40 object-cover"
              />
            ) : (
              <div className="w-[88px] h-[88px] rounded-2xl border-2 border-cream/40 bg-acid text-ink flex items-center justify-center font-black text-2xl">
                {initials(store.storeName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black tracking-widest text-acid mb-1">Verified Store</p>
              <h1 className="text-3xl md:text-5xl font-black uppercase leading-none break-words">{store.storeName}</h1>
              {store.storeDescription && (
                <p className="mt-2 text-sm text-cream/80 max-w-xl line-clamp-2">{store.storeDescription}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {store.instagramUrl ? (
              <a
                href={store.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-black uppercase px-4 py-2 rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white border-2 border-ink"
              >
                <span className="text-sm">📷</span> Follow on Instagram
              </a>
            ) : (
              <span className="text-xs font-black uppercase px-4 py-2 rounded-full bg-cream/10 border-2 border-cream/30 text-cream/70">
                No social links yet
              </span>
            )}
            {store.location && (
              <span className="text-xs font-black uppercase px-4 py-2 rounded-full bg-cream/10 border-2 border-cream/30 text-cream/80">
                📍 {store.location}
              </span>
            )}
          </div>

          {store.returnPolicy && (
            <p className="mt-4 text-xs font-bold text-cream/70 max-w-2xl">Return policy: {store.returnPolicy}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 pb-24">
        <h2 className="text-2xl font-black uppercase mb-6">
          Drops <span className="text-gray-400">({display.length})</span>
        </h2>

        {display.length === 0 ? (
          <div className="border-2 border-dashed border-ink/20 rounded-3xl p-12 text-center">
            <p className="text-lg font-black uppercase text-gray-400">Nothing on the shelf yet</p>
            <p className="mt-1 text-sm font-bold text-gray-400">New drops are on the way — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {display.map((l) => {
              const mins = (new Date(l.endsAt).getTime() - Date.now()) / (1000 * 60);
              const isAuction = l.listingMode === "AUCTION" || l.listingMode === "BOTH";
              const isRetail = l.listingMode === "RETAIL" || l.listingMode === "BOTH";
              return (
                <div
                  key={l.id}
                  className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 aspect-[4/5] flex flex-col relative"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border-2 border-ink ${
                        l.listingMode === "RETAIL" ? "bg-bubblegum text-white" : l.listingMode === "BOTH" ? "bg-acid text-ink" : "bg-white text-ink"
                      }`}
                    >
                      {l.listingMode === "RETAIL" ? "🛍️ Buy Now" : l.listingMode === "BOTH" ? "⚡ Both" : "🔨 Auction"}
                    </span>
                  </div>
                  {!l.isLive && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="text-[9px] font-black uppercase bg-ink text-acid px-2.5 py-1 rounded-full border-2 border-ink">
                        Upcoming
                      </span>
                    </div>
                  )}
                  <Link href={`/listing/${encodeURIComponent(l.id)}`} className="group flex flex-col flex-1">
                    <div className="flex-1 flex items-center justify-center text-5xl mb-3 pt-4">{l.category.emoji}</div>
                    <h3 className="font-black text-sm uppercase text-center mb-2 line-clamp-2 group-hover:underline">
                      {l.title}
                    </h3>
                  </Link>
                  {l.size && (
                    <div className="mb-2 text-center">
                      <span className="text-xs font-black uppercase bg-ink/5 border border-ink/20 rounded-full py-1 px-2">
                        {l.size}
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    {isRetail && l.buyNowPrice != null ? (
                      <>
                        <span className="font-black block text-lg">{money(l.buyNowPrice)}</span>
                        <span className="text-xs uppercase font-black text-gray-500">
                          {isAuction ? `or bid from ${money(l.startingBid)}` : "Buy now"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-black block text-lg">{money(l.currentBid ?? l.startingBid)}</span>
                        <span className="text-xs uppercase font-black text-gray-500">
                          {l.bidCount} bids · {endsIn(mins)} left
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}