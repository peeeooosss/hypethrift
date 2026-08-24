import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import CountdownTimer from "@/components/ui/CountdownTimer";

export const revalidate = 0;

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

export default async function AccountBidsPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
        <p className="text-gray-500 font-bold mb-4">Sign in to view your bids.</p>
        <Link href="/login" className="inline-block bg-ink text-white px-5 py-3 rounded-2xl font-black uppercase text-sm border-2 border-ink hover:bg-acid hover:text-ink">
          Sign in
        </Link>
      </div>
    );
  }

  const bids = await prisma.bid.findMany({
    where: { bidderId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { category: true } } },
  });
  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    select: { id: true, listingId: true, status: true, paymentDeadline: true },
  });
  const orderByListing = new Map(orders.map((order) => [order.listingId, order]));

  const liveBids = bids.filter((b) => new Date(b.listing.endsAt) > new Date() && b.listing.status === "ACTIVE");
  const pastBids = bids.filter((b) => !(new Date(b.listing.endsAt) > new Date() && b.listing.status === "ACTIVE"));

  const BidRow = ({ bid }: { bid: (typeof bids)[number] }) => {
    const current = bid.listing.currentBid ?? bid.listing.startingBid;
    const isHighest = bid.amount >= current;
    const isEnded = new Date(bid.listing.endsAt) <= new Date();
    let status: string;
    if (isEnded && isHighest) status = "Won";
    else if (isEnded) status = "Ended (outbid)";
    else if (isHighest) status = "Winning";
    else status = "Outbid";
    const order = isEnded && isHighest ? orderByListing.get(bid.listing.id) : undefined;
    const showTimer = status === "Won" && order && (order.status === "PENDING_CONTACT_FEE" || order.status === "WAITING_VERIFICATION");
    const paymentDeadline = order?.paymentDeadline;
    return (
      <div key={bid.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-4 hover:bg-ink/5 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/listing/${encodeURIComponent(bid.listing.id)}`} className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl border-2 border-ink bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">{bid.listing.category?.emoji ?? "📦"}</div>
            <div className="min-w-0">
              <p className="font-black uppercase line-clamp-1">{bid.listing.title}</p>
              <p className="text-xs text-gray-500 font-bold">
                Your bid: {money(bid.amount)} · current high: {money(current)}
              </p>
            </div>
          </Link>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-xs font-black uppercase border border-ink px-2 py-1 rounded-full">{status}</span>
            {showTimer && (
              <CountdownTimer deadline={paymentDeadline} compact />
            )}
            {status === "Won" && (!order || order.status === "PENDING_CONTACT_FEE" || order.status === "REJECTED") && (
              <Link href={`/account/bids/${encodeURIComponent(bid.listing.id)}/contact`} className="bg-bubblegum border-2 border-ink px-3 py-1 rounded-full text-xs font-black uppercase hover:bg-acid">
                Contact now
              </Link>
            )}
            {status === "Won" && order?.status === "WAITING_VERIFICATION" && (
              <Link href={`/account/orders/${order.id}`} className="text-xs font-black uppercase underline">Waiting for verification</Link>
            )}
            {status === "Won" && order?.status === "CONTACT_FEE_PAID" && (
              <Link href={`/account/orders/${order.id}`} className="bg-acid border-2 border-ink px-3 py-1 rounded-full text-xs font-black uppercase">Order status</Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase">My Bids</h1>

      <div>
        <h2 className="text-xl font-black uppercase mb-3 text-bubblegum">Live Bids ({liveBids.length})</h2>
        {liveBids.length === 0 ? (
          <p className="text-gray-500 font-bold uppercase">No active bids.</p>
        ) : (
          <div className="space-y-3">{liveBids.map((b) => <BidRow key={b.id} bid={b} />)}</div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-black uppercase mb-3 text-gray-500">Past Bids ({pastBids.length})</h2>
        {pastBids.length === 0 ? (
          <p className="text-gray-500 font-bold uppercase">No past bids.</p>
        ) : (
          <div className="space-y-3">{pastBids.map((b) => <BidRow key={b.id} bid={b} />)}</div>
        )}
      </div>
    </div>
  );
}
