import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOrderFromListing } from "@/actions/auction-actions";
import BidForm from "@/components/listing/BidForm";
import BidHistory from "@/components/listing/BidHistory";
import SaveButton from "@/components/listing/SaveButton";

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
  const rawId = (await params).id;
  const id = decodeURIComponent(rawId);
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
  const isSaved = session?.user
    ? (await prisma.savedItem.count({ where: { userId: session.user.id, listingId: id } })) > 0
    : false;
  const currentBid = listing.currentBid ?? listing.startingBid;
  const nextMin = currentBid + listing.bidIncrement;
  const endsMs = new Date(listing.endsAt).getTime();
  const isEnded = endsMs <= Date.now();
  const canBid =
    !!session?.user && listing.status === "ACTIVE" && !isEnded && session.user.id !== listing.sellerId;

  const winningBid = isEnded
    ? (await prisma.bid.findFirst({ where: { listingId: listing.id }, orderBy: [{ amount: "desc" }, { createdAt: "asc" }] })) ?? undefined
    : undefined;

  const existingOrder = isEnded && winningBid
    ? await prisma.order.findUnique({
        where: { listingId: listing.id },
        select: { id: true, status: true, buyerId: true },
      })
    : null;

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-6">
          <div className="relative">
            {listing.images.length > 0 ? (
              <div className="aspect-[4/3] rounded-2xl border-2 border-ink overflow-hidden mb-4">
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-ink/30 bg-gray-50 flex items-center justify-center text-6xl mb-4">
                📦
              </div>
            )}
            {session?.user && (
              <div className="absolute top-3 right-3">
                <SaveButton listingId={listing.id} initiallySaved={isSaved} />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black uppercase mb-2">{listing.title}</h1>
          <p className="text-gray-600 font-bold mb-4">
            Listed in {listing.category.emoji} {listing.category.name}
          </p>
          <p className="text-gray-700 leading-relaxed">{listing.description}</p>
        </div>

        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <h2 className="text-xl font-black uppercase mb-3">
            Bid History ({listing.bidCount})
          </h2>
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
            <span>Size</span>
          </div>
          <div className="flex justify-between items-baseline mb-6">
            <span className="text-xl font-black">{money(listing.startingBid)}</span>
            <span className="text-xs font-black uppercase">
              {listing.condition?.replace("_", " ") ?? "—"}
            </span>
            <span className="text-xs font-black uppercase bg-ink/5 border border-ink/20 rounded-full py-1 px-2">
              {listing.size ?? "—"}
            </span>
          </div>

          {listing.reservePrice && (
            <p className="text-xs font-bold bg-acid/20 border-2 border-acid rounded-xl py-2 px-3 mb-4">
              Reserve: {money(listing.reservePrice)}
            </p>
          )}

          <div className="bg-ink/5 border-2 border-dashed border-ink/20 rounded-xl py-3 text-center mb-6">
            <span className="font-black text-bubblegum">
              Time left: {timeRemaining(listing.endsAt.toString())}
            </span>
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

      <EndedAuctionView
        listing={listing}
        winningBid={winningBid}
        existingOrder={existingOrder}
        currentUserId={session?.user?.id}
      />
    </div>
  );
}

function EndedAuctionView({
  listing,
  winningBid,
  existingOrder,
  currentUserId,
}: {
  listing: {
    id: string;
    status: string;
    currentBid: number | null;
    reservePrice: number | null;
  };
  winningBid: { amount: number; bidderId: string } | undefined;
  existingOrder: { id: string; status: string; buyerId: string } | null;
  currentUserId?: string;
}) {
  const ORDER_LABEL: Record<string, string> = {
    PENDING_CONTACT_FEE: "Contact fee required",
    WAITING_VERIFICATION: "Waiting for verification",
    CONTACT_FEE_PAID: "Seller details unlocked",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Payment rejected",
  };

  if (!winningBid && !existingOrder) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
        <div className="text-center">
          <h2 className="text-xl font-black uppercase mb-2">Auction Ended</h2>
          <p className="text-gray-500 font-bold">No bids were placed.</p>
        </div>
      </div>
    );
  }

  if (listing.reservePrice && (listing.currentBid ?? 0) < listing.reservePrice) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
        <div className="text-center">
          <h2 className="text-xl font-black uppercase mb-2">Reserve Not Met</h2>
          <p className="text-gray-500 font-bold">
            The reserve price of ₹{listing.reservePrice.toLocaleString("en-IN")} was not reached.
          </p>
        </div>
      </div>
    );
  }

  const isWinner = winningBid?.bidderId === currentUserId;
  const orderStatus = existingOrder?.status;

  if (orderStatus === "CONTACT_FEE_PAID" || orderStatus === "COMPLETED") {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
        <div className="text-center">
          <h2 className="text-xl font-black uppercase mb-2">Order Confirmed</h2>
          <p className="text-gray-600 font-bold mb-4">
            Status: <span className="text-acid uppercase">{ORDER_LABEL[orderStatus!] ?? orderStatus}</span>
          </p>
          <Link
            href="/account/orders"
            className="block text-center bg-acid border-2 border-ink py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum transition-colors"
          >
            View Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
      <h2 className="text-xl font-black uppercase mb-3">Auction Ended</h2>
      {winningBid && (
        <p className="text-lg font-black mb-2">
          Winning bid: ₹{winningBid.amount.toLocaleString("en-IN")}
        </p>
      )}

      {isWinner && !existingOrder && (
        <form action={async (formData: FormData) => { await createOrderFromListing(listing.id, formData); }}>
          <button
            type="submit"
            className="w-full text-center bg-bubblegum border-2 border-ink shadow-brut-md py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid transition-colors"
          >
            Proceed to Checkout
          </button>
        </form>
      )}

      {isWinner && existingOrder && (orderStatus === "PENDING_CONTACT_FEE" || orderStatus === "REJECTED") && (
        <Link
          href={`/account/bids/${encodeURIComponent(listing.id)}/contact`}
          className="block text-center bg-bubblegum border-2 border-ink shadow-brut-md py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid transition-colors"
        >
          Complete Payment
        </Link>
      )}

      {!isWinner && existingOrder && (
        <p className="text-sm font-bold text-gray-500 mt-2">
          Sold to another bidder.{" "}
          <Link href="/listings" className="underline font-black">
            Browse more auctions
          </Link>
        </p>
      )}
    </div>
  );
}
