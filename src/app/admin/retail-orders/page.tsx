import { getRetailOrdersAdmin } from "@/lib/retail-data";
import { cancelRetailOrder, rejectRetailPayment, verifyRetailPayment } from "@/actions/retail-actions";
import { formatAddress } from "@/lib/platform";
import WhatsAppMessageButton from "@/components/admin/WhatsAppMessageButton";
import { resolveWhatsAppMessages, RETAIL_BUYER_TEMPLATES, RETAIL_SELLER_TEMPLATES } from "@/lib/whatsapp-templates";
import { RETAIL_ORDER_STATUS_LABEL } from "@/types/retail";

export const revalidate = 0;

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function AdminRetailOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string }>;
}) {
  const { status: statusFilter, saved } = await searchParams;
  const orders = await getRetailOrdersAdmin();
  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const waitingVerification = orders.filter((o) => o.status === "PENDING_PAYMENT");
  const activeCount = orders.filter((o) => ["PENDING_PAYMENT", "PAYMENT_VERIFIED", "PACKED", "SHIPPED", "DELIVERED"].includes(o.status)).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-white">Buy Now Orders</h1>
          <p className="text-white/70 font-bold mt-2">Verify payments, release addresses, and track fulfilment.</p>
        </div>
      </div>

      {saved === "verified" && (
        <div className="bg-acid border-2 border-ink rounded-2xl px-5 py-3 font-black text-sm text-ink">Payment verified — address released to the seller.</div>
      )}
      {saved === "rejected" && (
        <div className="bg-yellow-300 border-2 border-ink rounded-2xl px-5 py-3 font-black text-sm text-ink">Proof rejected — buyer notified to resubmit.</div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Total", orders.length, "bg-white"],
          ["Awaiting verification", waitingVerification.length, "bg-yellow-300"],
          ["In progress", activeCount, "bg-bubblegum"],
        ].map(([label, count, color]) => (
          <div key={String(label)} className={`${color} border-2 border-ink rounded-2xl p-4`}>
            <p className="text-[10px] uppercase font-black">{label}</p>
            <p className="text-2xl font-black mt-1">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <a href="/admin/retail-orders" className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${!statusFilter ? "bg-white text-ink" : "text-white"}`}>
          All ({orders.length})
        </a>
        {["PENDING_PAYMENT", "PAYMENT_VERIFIED", "SHIPPED", "COMPLETED", "CANCELLED"].map((status) => (
          <a key={status} href={`/admin/retail-orders?status=${status}`} className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${statusFilter === status ? "bg-white text-ink" : "text-white"}`}>
            {RETAIL_ORDER_STATUS_LABEL[status as keyof typeof RETAIL_ORDER_STATUS_LABEL]} ({counts[status] ?? 0})
          </a>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
          <p className="text-gray-500 font-bold">No Buy Now orders here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((order) => {
            const context = {
              orderId: order.id,
              itemTitle: order.listing?.title,
              buyerName: order.buyerName ?? order.buyer?.name ?? order.buyer?.email,
              sellerName: order.seller?.name ?? order.seller?.email,
              storeName: order.seller?.sellerProfile?.storeName ?? order.seller?.name ?? undefined,
              finalPrice: order.finalPrice,
              fee: order.connectionFee,
              total: order.total,
              buyerPhone: order.buyerPhone ?? order.buyer?.phone ?? undefined,
              sellerWhatsApp: order.seller?.sellerProfile?.whatsappNumber,
              trackingNumber: order.trackingNumber ?? undefined,
              address: order.address ? formatAddress(order.address) : undefined,
            };

            return (
              <article key={order.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 md:p-6">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black uppercase truncate">🛍️ {order.listing?.title ?? "Unknown item"}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1 break-all">Order ID: {order.id}</p>
                    <p className="text-sm font-black mt-1">
                      {money(order.finalPrice)} + {order.connectionFee} fee = <span className="text-acid">{money(order.total)}</span>
                      {order.commission != null && <span className="text-gray-500"> · commission {money(order.commission)} · payout {money(order.sellerPayout ?? 0)}{order.payoutAt ? " · paid ✓" : ""}</span>}
                    </p>
                    <p className="text-xs text-gray-500 font-bold mt-1">
                      Buyer: {order.buyerName ?? order.buyer?.name ?? order.buyer?.email ?? "—"} · Seller: {order.seller?.sellerProfile?.storeName ?? order.seller?.name ?? order.seller?.email ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start justify-end gap-2">
                    <span className={`h-fit border-2 border-ink rounded-full px-3 py-1 text-xs font-black uppercase ${
                      order.status === "COMPLETED" ? "bg-acid text-ink" : order.status === "CANCELLED" ? "bg-gray-300 text-ink" : order.status === "PENDING_PAYMENT" ? "bg-yellow-300 text-ink" : "bg-bubblegum text-white"
                    }`}>
                      {RETAIL_ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <WhatsAppMessageButton
                      number={order.buyerPhone ?? order.buyer?.phone}
                      messages={resolveWhatsAppMessages(RETAIL_BUYER_TEMPLATES, context)}
                      label="Buyer chat"
                      compact
                    />
                    <WhatsAppMessageButton
                      number={order.seller?.sellerProfile?.whatsappNumber}
                      messages={resolveWhatsAppMessages(RETAIL_SELLER_TEMPLATES, context)}
                      label="Seller chat"
                      compact
                    />
                    {["PENDING_PAYMENT", "PAYMENT_VERIFIED", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) && (
                      <form action={cancelRetailOrder} className="flex items-center gap-1">
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="bg-red-500 text-white border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-red-600">Cancel</button>
                      </form>
                    )}
                  </div>
                </div>

                {order.status === "PENDING_PAYMENT" && (
                  <div className="mt-4 bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Payment verification</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-bold text-gray-600">
                        Paid via {order.paymentMethod ?? "?"} · <span className="font-black">₹{order.total.toLocaleString("en-IN")}</span> · receiver {order.buyerPhone ?? "no phone"}
                      </p>
                      {order.paymentProofUrl && (
                        <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-black uppercase bg-ink text-white border-2 border-ink px-3 py-1.5 rounded-full hover:bg-acid hover:text-ink">
                          View proof
                        </a>
                      )}
                      <form action={verifyRetailPayment}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="bg-acid border-2 border-ink px-3 py-1.5 rounded-full text-xs font-black uppercase hover:bg-bubblegum">✓ Verify & release</button>
                      </form>
                      <form action={rejectRetailPayment}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input name="note" placeholder="Reject reason" className="border-2 border-ink rounded-full px-3 py-1 text-xs font-bold" />
                        <button className="bg-yellow-300 border-2 border-ink px-3 py-1.5 rounded-full text-xs font-black uppercase ml-1 hover:bg-bubblegum">Reject</button>
                      </form>
                    </div>
                  </div>
                )}

                {order.address && (["PENDING_PAYMENT", "PAYMENT_VERIFIED", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status)) && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Shipping address</p>
                      <p className="text-sm font-bold leading-relaxed">{formatAddress(order.address)}</p>
                      <p className="text-xs font-bold text-gray-500 mt-1">Receiver: {order.buyerName} · {order.buyerPhone}</p>
                    </div>
                    <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Fulfilment</p>
                      {order.trackingNumber ? (
                        <p className="text-sm font-bold">Tracking: {order.trackingNumber}</p>
                      ) : (
                        <p className="text-sm font-bold text-gray-500">Awaiting seller shipment.</p>
                      )}
                      {order.adminVerifiedAt && <p className="text-xs font-bold text-gray-500 mt-1">Payment verified {new Date(order.adminVerifiedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}