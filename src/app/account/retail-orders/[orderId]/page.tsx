import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRetailOrder } from "@/lib/retail-data";
import { confirmRetailReceived } from "@/actions/retail-actions";
import { RETAIL_ORDER_STATUS_LABEL, type RetailOrderStatus } from "@/types/retail";
import { formatAddress, whatsappUrl } from "@/lib/platform";

export const revalidate = 0;

const FLOW: RetailOrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_VERIFIED", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"];

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function BuyerRetailOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { orderId } = await params;
  const { saved, error } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect(session.user.role === "SELLER" ? "/seller" : "/admin");

  const order = await getRetailOrder(orderId);
  if (!order || order.buyerId !== session.user.id) notFound();

  const idx = FLOW.indexOf(order.status);
  const cancelled = order.status === "CANCELLED";
  const sellerWhatsApp = order.seller.sellerProfile?.whatsappNumber;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/account/retail-orders" className="text-sm font-black underline">← Back to Buy Now Orders</Link>

      {saved === "completed" && (
        <div className="bg-acid border-2 border-ink shadow-brut-md rounded-2xl px-5 py-4 font-black uppercase text-sm">
          Order confirmed — thanks! Payment has now been released to the seller.
        </div>
      )}
      {error === "not_ready" && (
        <div className="bg-bubblegum text-white border-2 border-ink shadow-brut-md rounded-2xl px-5 py-4 font-black uppercase text-sm">
          This order is not ready to confirm yet.
        </div>
      )}

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase font-black text-bubblegum tracking-widest">Buy Now order</p>
            <h1 className="text-2xl font-black uppercase mt-1">{order.listing.category?.emoji ?? "🛍️"} {order.listing.title}</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">Order #{order.id} · {order.listing.size ?? "One Size"}</p>
          </div>
          <span className={`border-2 border-ink rounded-full px-4 py-1.5 text-xs font-black uppercase ${cancelled ? "bg-gray-300 text-ink" : order.status === "COMPLETED" ? "bg-acid text-ink" : "bg-bubblegum text-white"}`}>
            {RETAIL_ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>

        <div className="mt-5 p-4 bg-ink/5 border-2 border-ink/20 rounded-2xl space-y-1">
          <p className="flex justify-between text-sm font-bold"><span className="text-gray-500">Item price</span><span>{money(order.finalPrice)}</span></p>
          <p className="flex justify-between text-sm font-bold"><span className="text-gray-500">Handling fee</span><span>{money(order.connectionFee)}</span></p>
          <p className="flex justify-between text-lg font-black border-t-2 border-dashed border-ink/30 pt-2"><span>Total paid</span><span className="text-acid">{money(order.total)}</span></p>
        </div>
      </div>

      {!cancelled && order.status !== "COMPLETED" && (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <p className="text-xs uppercase font-black text-gray-500 mb-4">Order progress</p>
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((s, stepIdx) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase rounded-full px-3 py-1 border-2 border-ink ${
                  stepIdx < idx ? "bg-acid/40 text-ink" : stepIdx === idx ? "bg-ink text-white" : "bg-ink/5 text-gray-400 border-ink/20"
                }`}>
                  {RETAIL_ORDER_STATUS_LABEL[s]}
                </span>
                {stepIdx < FLOW.length - 1 && <span className="text-gray-300 font-black">›</span>}
              </div>
            ))}
          </div>

          {order.status === "PENDING_PAYMENT" && (
            <p className="text-sm font-bold text-gray-600 mt-4">
              Waiting for payment verification. Make sure you sent your screenshot — our team checks it on WhatsApp.
            </p>
          )}
          {order.status === "DELIVERED" && (
            <form action={confirmRetailReceived} className="mt-4">
              <input type="hidden" name="orderId" value={order.id} />
              <button className="w-full bg-acid border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase text-lg hover:bg-bubblegum transition-colors">
                I Received It — Confirm
              </button>
              <p className="text-xs text-gray-500 font-bold mt-2">Confirming releases the payment to the seller.</p>
            </form>
          )}
        </div>
      )}

      {sellerWhatsApp && !cancelled && order.status !== "COMPLETED" && order.status !== "PENDING_PAYMENT" && (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <h2 className="text-lg font-black uppercase mb-2">Seller contact</h2>
          <p className="text-sm font-bold text-gray-500 mb-4">
            {order.seller.sellerProfile?.storeName ?? order.seller.name ?? "The seller"} is now ready to help. Reach out directly on WhatsApp for shipping updates.
          </p>
          <a
            href={whatsappUrl(sellerWhatsApp, `Hi ${order.seller.sellerProfile?.storeName ?? "seller"}, I have a HypeThrift Buy Now order #${order.id.slice(-8)} for "${order.listing.title}".`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-ink text-white border-2 border-ink shadow-brut-md px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
          >
            💬 Message seller on WhatsApp
          </a>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <h2 className="text-lg font-black uppercase mb-3">Tracking</h2>
          {order.trackingNumber ? (
            <div className="space-y-1">
              <p className="text-sm font-bold">Tracking: <span className="font-black">{order.trackingNumber}</span></p>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-bubblegum underline">Open tracking page</a>
              )}
            </div>
          ) : (
            <p className="text-sm font-bold text-gray-500">{order.status === "CANCELLED" ? "This order was cancelled." : "Tracking is shared once the seller ships your item."}</p>
          )}
          {order.shippedAt && <p className="text-xs font-bold text-gray-500 mt-2">Shipped {new Date(order.shippedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
        </div>

        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <h2 className="text-lg font-black uppercase mb-3">Delivery address</h2>
          {order.address ? (
            <p className="text-sm font-bold leading-relaxed">{formatAddress(order.address)}</p>
          ) : (
            <p className="text-sm font-bold text-gray-500">No address on record.</p>
          )}
          {order.buyerPhone && <p className="text-sm font-bold text-gray-500 mt-2">Receiver phone: {order.buyerPhone}</p>}
        </div>
      </div>

      {cancelled && (
        <div className="bg-gray-100 border-2 border-ink rounded-3xl p-6">
          <p className="font-black uppercase">Order cancelled</p>
          <p className="text-sm font-bold text-gray-600 mt-1">{order.adminNotes ?? "Cancelled by support. Contact us on WhatsApp for a refund."}</p>
        </div>
      )}

      {order.status === "COMPLETED" && (
        <div className="bg-acid border-2 border-ink shadow-brut-lg rounded-3xl p-6 text-center">
          <p className="text-2xl font-black uppercase">Order complete 🎉</p>
          <p className="font-bold text-sm text-ink/70 mt-2">Thanks for shopping on HypeThrift. Tag @hypethrift when you unbox!</p>
        </div>
      )}
    </div>
  );
}