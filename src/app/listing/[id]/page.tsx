import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import BidForm from "@/components/listing/BidForm";
import BidHistory from "@/components/listing/BidHistory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeRemaining(end: string) {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { name: true, email: true, image: true } },
      bids: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { bidder: { select: { name: true, email: true, image: true } } },
      },
    },
  });

  if (!listing) notFound();

  const session = await auth();
  const currentBid = listing.currentBid ?? listing.startingBid;
  const nextMin = currentBid + listing.bidIncrement;
  const endsMs = new Date(listing.endsAt).getTime();
  const isEnded = endsMs <= Date.now();
  const canBid = session?.user && listing.status === "ACTIVE" && !isEnded && session.user.id !== listing.sellerId;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-6">
          {listing.images.length > 0 ? (
            <div className="aspect-[4/3] rounded-2xl border-2 border-ink overflow-hidden mb-4">
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-ink/30 bg-gray-50 flex items-center justify-center text-6xl mb-4">📦</div>
          )}
          <h1 className="text-3xl font-black uppercase mb-2">{listing.title}</h1>
          <p className="text-gray-600 font-bold mb-4">Listed in {listing.category.emoji} {listing.category.name}</p>
          <p className="text-gray-700 leading-relaxed">{listing.description}</p>
        </div>

        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <h2 className="text-xl font-black uppercase mb-3">Bid History ({listing.bidCount})</h2>
          <BidHistory bids={listing.bids} currentUserId={session?.user?.id} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <div className="flex justify-between text-xs uppercase font-black text-gray-500 tracking-wider mb-2">
            <span>Current Bid</span>
            <span>Status</span>
          </div>
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-4xl font-black">{money(currentBid)}</span>
            <span className="text-xs font-black uppercase">{listing.status.replace("_", " ")}</span>
          </div>

          <div className="flex justify-between text-xs uppercase font-black text-gray-500 tracking-wider mb-2">
            <span>Starting bid</span>
            <span>Condition</span>
          </div>
          <div className="flex justify-between items-baseline mb-6">
            <span className="text-xl font-black">{money(listing.startingBid)}</span>
            <span className="text-xs font-black uppercase">{listing.condition?.replace("_", " ") ?? "—"}</span>
          </div>

          {listing.reservePrice && (
            <p className="text-xs font-bold bg-acid/20 border-2 border-acid rounded-xl py-2 px-3 mb-4">
              Reserve price met at {money(listing.reservePrice)}
            </p>
          )}

          <div className="bg-ink/5 border-2 border-dashed border-ink/20 rounded-xl py-3 text-center mb-6">
            <span className="font-black text-bubblegum">Time left: {timeRemaining(listing.endsAt.toString())}</span>
          </div>

          {canBid ? (
            <BidForm listingId={listing.id} minimum={nextMin} />
          ) : isEnded ? (
            <p className="text-center text-gray-500 font-bold uppercase">Auction ended</p>
          ) : session?.user?.id === listing.sellerId ? (
            <p className="text-center text-gray-500 font-bold uppercase">You own this item</p>
          ) : (
            <Link
              href="/login"
              className="block text-center bg-ink text-white border-2 border-ink shadow-brut-md py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
            >
              Sign in to bid
            </Link>
          )}
        </div>

        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 text-center">
          <span className="font-black text-xs uppercase text-gray-500">Seller</span>
          <p className="text-xl font-black mt-1">
            {listing.seller.name ?? listing.seller.email}
          </p>
        </div>
      </div>
    </div>
  );
}
