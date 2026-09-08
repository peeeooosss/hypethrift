import Link from "next/link";
import Image from "next/image";
import SaveButton from "@/components/listing/SaveButton";

type LiveAuctionListing = {
  id: string;
  title: string;
  images: string[];
  currentBid: number | null;
  startingBid: number;
  bidCount: number;
  size: string | null;
  endsAt: string;
  category: { emoji: string };
};

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function endsIn(minutes: number) {
  if (minutes < 0) return "Ended";
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.floor(minutes % 60)}m`;
}

export default async function LiveAuctionsStrip({
  listings,
  savedIds,
  signedIn,
}: {
  listings: LiveAuctionListing[];
  savedIds: Set<string>;
  signedIn: boolean;
}) {
  if (listings.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">🔴 Live Auctions</h2>
        <Link
          href="/listings"
          className="text-sm font-black uppercase text-gray-500 border-2 border-ink px-4 py-2 rounded-full hover:bg-acid"
        >
          See all
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {listings.map((l) => {
          const mins = (new Date(l.endsAt).getTime() - Date.now()) / (1000 * 60);
          const href = `/listing/${encodeURIComponent(l.id)}`;
          return (
            <div key={l.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-4 aspect-[4/5] flex flex-col relative group">
              {signedIn && (
                <div className="absolute top-1 right-1 z-10">
                  <SaveButton listingId={l.id} initiallySaved={savedIds.has(l.id)} size="sm" />
                </div>
              )}
              <Link href={href} className="group">
                <div className="relative flex-1 flex items-center justify-center text-4xl mb-3 overflow-hidden rounded-2xl">
                  {l.images?.[0] ? (
                    <Image
                      src={l.images[0]}
                      alt={l.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 16vw, 180px"
                      className="object-cover"
                    />
                  ) : (
                    l.category.emoji
                  )}
                </div>
                <h3 className="font-black text-sm uppercase text-center mb-2 line-clamp-2">{l.title}</h3>
                <div className="text-center">
                  <span className="font-black text-lg block">{money(l.currentBid ?? l.startingBid)}</span>
                  <span className="text-xs uppercase font-black text-gray-500">{l.bidCount} bids</span>
                </div>
                {l.size && (
                  <span className="mt-1 text-center text-xs font-black uppercase bg-ink/5 border border-ink/20 rounded-full py-1 px-2 block">
                    {l.size}
                  </span>
                )}
                <div className="mt-2 text-center text-xs font-black text-bubblegum">{endsIn(mins)} left</div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
