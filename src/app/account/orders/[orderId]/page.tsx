import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAddress, whatsappUrl } from "@/lib/platform";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { confirmOrderReceived, updateBuyerOrderDetails } from "@/actions/auction-actions";
import { BUYER_AGREEMENT } from "@/data/agreements";
import AgreementSections from "@/components/legal/AgreementSections";

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

export default async function AccountOrderStatusPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { orderId } = await params;
  const { error } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: orderId, buyerId: session.user.id },
    include: { listing: { include: { category: true } }, seller: { include: { sellerProfile: true } } },
  });
  if (!order) notFound();

  const details = order.sellerOrderDetails && typeof order.sellerOrderDetails === "object" ? order.sellerOrderDetails as Record<string, unknown> : {};
  const sellerNumber = order.seller.sellerProfile?.whatsappNumber;
  const shipping = order.shippingAddress && typeof order.shippingAddress === "object" ? order.shippingAddress as Record<string, unknown> : {};
  const hasAddress = Boolean(shipping.line1 && shipping.city && shipping.state && shipping.pincode);
  const needsBuyerDetails = !order.buyerAgreementAccepted || !order.buyerPhone || !hasAddress;
  const needsContactFee = order.status === "PENDING_CONTACT_FEE" || order.status === "REJECTED" || (order.status === "CONTACT_FEE_PAID" && !order.contactFeeConfirmed);
  const addresses = needsBuyerDetails
    ? await prisma.address.findMany({ where: { userId: session.user.id }, orderBy: { isDefault: "desc" } })
    : [];
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

      {error && (
        <p className="text-red-600 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl p-4">
          {error === "address" ? "Enter a complete shipping address or choose a saved address." : "Please complete all required buyer details."}
        </p>
      )}

      {needsBuyerDetails && !needsContactFee && order.status !== "CANCELLED" && (
        <form action={updateBuyerOrderDetails} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-black uppercase">Complete your buyer details</h2>
            <p className="text-sm text-gray-500 font-bold mt-1">Seller access is unlocked, but we still need these details for the transaction.</p>
          </div>
          <AgreementSections sections={BUYER_AGREEMENT} heading="Buyer agreement" fullHref="/agreements/buyer" />
          <label className="flex items-start gap-3 text-sm font-bold">
            <input type="checkbox" name="agreement" required defaultChecked={order.buyerAgreementAccepted} className="mt-1" />
            <span>I have read and accept the Buyer Agreement for this order.</span>
          </label>
          <input type="hidden" name="orderId" value={order.id} />
          <div>
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Phone number</label>
            <input name="phone" required inputMode="tel" defaultValue={order.buyerPhone ?? ""} placeholder="Your WhatsApp number" className="w-full border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
          </div>
          {addresses.length > 0 && (
            <div>
              <label className="block text-xs uppercase font-black text-gray-500 mb-1">Saved address</label>
              <select name="addressId" defaultValue={addresses.find((address) => address.isDefault)?.id ?? ""} className="w-full border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm">
                <option value="">Enter a new address below</option>
                {addresses.map((address) => <option key={address.id} value={address.id}>{address.label}: {address.line1}, {address.city}</option>)}
              </select>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <input name="label" placeholder="Address label" defaultValue={String(shipping.label ?? "") } className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            <input name="line1" placeholder="Address line 1" defaultValue={String(shipping.line1 ?? "") } className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            <input name="line2" placeholder="Address line 2 (optional)" defaultValue={String(shipping.line2 ?? "") } className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            <input name="city" placeholder="City" defaultValue={String(shipping.city ?? "") } className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            <input name="state" placeholder="State" defaultValue={String(shipping.state ?? "") } className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            <input name="pincode" placeholder="Pincode" defaultValue={String(shipping.pincode ?? "") } className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
          </div>
          <button className="w-full bg-ink text-white border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase hover:bg-acid hover:text-ink">Save buyer details</button>
        </form>
      )}

      {order.contactFeeConfirmed && order.status === "CONTACT_FEE_PAID" && (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black uppercase">Complete your order</h2>
            <p className="text-sm text-gray-600 font-bold mt-1">Contact the seller, pay the item price directly to them, and confirm receipt here after delivery.</p>
          </div>
          {order.itemPaymentDeadline && (
            <div className="bg-bubblegum/30 border-2 border-bubblegum rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-black uppercase">Item payment deadline</span>
              <CountdownTimer deadline={order.itemPaymentDeadline} compact />
            </div>
          )}
          {order.sellerMarkedReadyAt ? (
            <form action={async (formData: FormData) => { "use server"; await confirmOrderReceived(formData); }}>
              <input type="hidden" name="orderId" value={order.id} />
              <button className="w-full bg-acid border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase hover:bg-bubblegum">I received the item - complete order</button>
            </form>
          ) : (
            <p className="text-sm font-bold bg-ink/5 border-2 border-dashed border-ink/20 rounded-xl p-4">The seller must confirm the handoff before you can complete the order.</p>
          )}
        </div>
      )}

      {order.contactFeeConfirmed && sellerNumber ? (
        <div className="bg-acid border-2 border-ink shadow-brut-lg rounded-3xl p-6 text-center">
          <h2 className="text-xl font-black uppercase">Seller connected</h2>
          <p className="font-bold mt-2">Send the complete order details to {order.seller.sellerProfile?.storeName ?? "the seller"}.</p>
          <a href={whatsappUrl(sellerNumber, sellerMessage)} className="inline-block mt-5 bg-ink text-white border-2 border-ink px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum hover:text-ink">Order Now on WhatsApp</a>
        </div>
      ) : needsContactFee ? (
        <Link href={`/account/bids/${encodeURIComponent(order.listingId)}/contact`} className="block text-center bg-bubblegum border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase hover:bg-acid">Pay ₹{order.platformFee} to unlock seller</Link>
      ) : null}
    </div>
  );
}
