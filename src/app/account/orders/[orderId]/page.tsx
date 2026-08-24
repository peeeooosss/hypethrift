import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAddress, whatsappUrl } from "@/lib/platform";
import CountdownTimer from "@/components/ui/CountdownTimer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LABELS: Record<string, string> = {
  PENDING_CONTACT_FEE: "Payment required",
  WAITING_VERIFICATION: "Waiting for verification",
  CONTACT_FEE_PAID: "Seller details unlocked",
  COMPLETED: "Completed",
  REJECTED: "Payment rejected",
  CANCELLED: "Cancelled",
};

export default async function AccountOrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: orderId, buyerId: session.user.id },
    include: { listing: { include: { category: true } }, seller: { include: { sellerProfile: true } } },
  });
  if (!order) notFound();

  const details = order.sellerOrderDetails && typeof order.sellerOrderDetails === "object" ? order.sellerOrderDetails as Record<string, unknown> : {};
  const sellerNumber = order.seller.sellerProfile?.whatsappNumber;
  const sellerMessage = [
    "Hi, I am the winning bidder for your HypeThrift listing.",
    `Order ID: ${order.id}`,
    `Item: ${order.listing.title}`,
    `Category: ${order.listing.category.name}`,
    `Size: ${order.listing.size ?? "Not specified"}`,
    `Condition: ${order.listing.condition ?? "Not specified"}`,
    `Winning bid: ₹${order.finalPrice}`,
    `Buyer: ${session.user.name ?? "Buyer"}`,
    `Phone: ${order.buyerPhone ?? "Not provided"}`,
    `Address: ${formatAddress(order.shippingAddress)}`,
  ].join("\n");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href="/account/orders" className="text-sm font-black underline">← Back to Orders</Link>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap justify-between gap-3">
          <div><p className="text-xs uppercase font-black text-gray-500">Order ID</p><p className="font-black break-all">{order.id}</p></div>
          <div className="flex items-center gap-2">
            <span className="bg-acid border-2 border-ink rounded-full px-3 py-1 text-xs font-black uppercase">{LABELS[order.status] ?? order.status}</span>
            {(order.status === "PENDING_CONTACT_FEE" || order.status === "WAITING_VERIFICATION") && order.paymentDeadline && (
              <CountdownTimer deadline={order.paymentDeadline} compact />
            )}
          </div>
        </div>
        <div className="mt-6 border-t-2 border-dashed border-ink/20 pt-5">
          <p className="font-black uppercase">{order.listing.category.emoji} {order.listing.title}</p>
          <p className="text-sm text-gray-500 font-bold">Winning bid: ₹{order.finalPrice.toLocaleString("en-IN")} · Contact fee: ₹{order.platformFee}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-ink rounded-2xl p-5"><p className="text-xs uppercase font-black text-gray-500">Agreement</p><p className="font-black mt-1">{order.buyerAgreementAccepted ? "Accepted" : "Not accepted"}</p></div>
        <div className="bg-white border-2 border-ink rounded-2xl p-5"><p className="text-xs uppercase font-black text-gray-500">Contact fee</p><p className="font-black mt-1">{order.contactFeeConfirmed ? "Verified" : order.status === "WAITING_VERIFICATION" ? "Waiting for admin" : "Not paid"}</p></div>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Order details</h2>
        <p className="text-sm font-bold"><span className="text-gray-500">Phone:</span> {order.buyerPhone ?? "Not provided"}</p>
        <p className="text-sm font-bold mt-2"><span className="text-gray-500">Address:</span> {formatAddress(order.shippingAddress)}</p>
        {typeof details.trackingNumber === "string" && details.trackingNumber && <p className="text-sm font-bold mt-2"><span className="text-gray-500">Tracking:</span> {details.trackingNumber}</p>}
        {typeof details.courier === "string" && details.courier && <p className="text-sm font-bold mt-2"><span className="text-gray-500">Courier:</span> {details.courier}</p>}
      </div>

      {order.contactFeeConfirmed && sellerNumber ? (
        <div className="bg-acid border-2 border-ink shadow-brut-lg rounded-3xl p-6 text-center">
          <h2 className="text-xl font-black uppercase">Seller connected</h2>
          <p className="font-bold mt-2">Send the complete order details to {order.seller.sellerProfile?.storeName ?? "the seller"}.</p>
          <a href={whatsappUrl(sellerNumber, sellerMessage)} className="inline-block mt-5 bg-ink text-white border-2 border-ink px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum hover:text-ink">Order Now on WhatsApp</a>
        </div>
      ) : order.status === "PENDING_CONTACT_FEE" || order.status === "REJECTED" ? (
        <Link href={`/account/bids/${encodeURIComponent(order.listingId)}/contact`} className="block text-center bg-bubblegum border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase hover:bg-acid">Pay ₹{order.platformFee} to unlock seller</Link>
      ) : null}
    </div>
  );
}
