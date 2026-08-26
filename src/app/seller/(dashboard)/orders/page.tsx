import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { markOrderCompleted, reportBuyerNoPayment, updateSellerOrderDetails } from "@/actions/auction-actions";
import { formatAddress } from "@/lib/platform";
import CountdownTimer from "@/components/ui/CountdownTimer";

export const revalidate = 0;

const LABELS: Record<string, string> = {
  PENDING_CONTACT_FEE: "Waiting for buyer",
  WAITING_VERIFICATION: "Waiting for admin",
  CONTACT_FEE_PAID: "Details unlocked",
  COMPLETED: "Completed",
  REJECTED: "Payment rejected",
  CANCELLED: "Cancelled",
};

export default async function SellerOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/account");

  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { category: true } }, buyer: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-black uppercase">Closed Bids</h1><p className="text-gray-500 font-bold mt-2">Manage buyer contact, payment, and completion for each winning bid.</p></div>
      {orders.length === 0 ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center"><p className="text-gray-500 font-bold">No closed bids yet.</p></div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const details = order.sellerOrderDetails && typeof order.sellerOrderDetails === "object" ? order.sellerOrderDetails as Record<string, unknown> : {};
            const unlocked = order.status === "CONTACT_FEE_PAID" || order.status === "COMPLETED";
            return (
              <article key={order.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 md:p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <div><p className="font-black uppercase">{order.listing.category.emoji} {order.listing.title}</p><p className="text-xs text-gray-500 font-bold mt-1">Order ID: {order.id}</p><p className="text-sm font-black mt-1">Winning bid: ₹{order.finalPrice.toLocaleString("en-IN")}</p></div>
                  <span className="h-fit bg-ink text-white border-2 border-ink rounded-full px-3 py-1 text-xs font-black uppercase">{LABELS[order.status] ?? order.status}</span>
                </div>

                {!unlocked ? (
                  <div className="mt-5 bg-ink/5 border-2 border-dashed border-ink/20 rounded-xl p-4 text-sm font-bold">
                    <p className="text-gray-800">Winner: {order.buyer.name ?? "—"} <span className="text-gray-500">({order.buyer.email})</span></p>
                    <p className="text-gray-600 mt-1">Phone, address, and WhatsApp contact unlock once the ₹69 contact fee is verified by admin.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid lg:grid-cols-2 gap-5">
                    <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
                      <h2 className="font-black uppercase text-sm mb-3">Buyer details</h2>
                      <p className="text-sm font-bold">{order.buyer.name ?? order.buyer.email}</p>
                      <p className="text-sm font-bold mt-1">Phone: {order.buyerPhone ?? "Not provided"}</p>
                      <p className="text-sm font-bold mt-1">Address: {formatAddress(order.shippingAddress)}</p>
                      <p className="text-sm font-bold mt-1">Buyer confirmation: {order.buyerConfirmedAt ? "Received" : "Pending"}</p>
                    </div>
                    <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
                      <h2 className="font-black uppercase text-sm mb-3">Seller update</h2>
                      <form action={async (formData: FormData) => { "use server"; await updateSellerOrderDetails(formData); }} className="space-y-2">
                        <input type="hidden" name="orderId" value={order.id} />
                        <input name="trackingNumber" defaultValue={String(details.trackingNumber ?? "")} placeholder="Tracking number (optional)" className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-bold" />
                        <input name="courier" defaultValue={String(details.courier ?? "")} placeholder="Courier / delivery method" className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-bold" />
                        <textarea name="notes" defaultValue={String(details.notes ?? "")} placeholder="Notes for the buyer" rows={2} className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-bold" />
                        <label className="flex gap-2 items-center text-xs font-black uppercase"><input type="checkbox" name="sellerPaymentReceived" defaultChecked={details.sellerPaymentReceived === true} /> Buyer paid me for the item</label>
                        <button className="w-full bg-ink text-white border-2 border-ink rounded-xl py-2 text-xs font-black uppercase hover:bg-acid hover:text-ink">Save order details</button>
                      </form>
                    </div>
                  </div>
                )}

                 {order.status === "CONTACT_FEE_PAID" && <div className="mt-5 space-y-3">
                   {order.itemPaymentDeadline && <div className="flex flex-wrap items-center justify-between gap-3 bg-bubblegum/20 border-2 border-bubblegum rounded-xl p-3"><span className="text-xs font-black uppercase">Item payment deadline</span><CountdownTimer deadline={order.itemPaymentDeadline} compact /></div>}
                   {!order.sellerMarkedReadyAt && <p className="text-xs font-bold text-gray-500">Save the buyer payment confirmation above, then mark the handoff ready. The buyer can complete the order after confirming receipt.</p>}
                   <div className="flex flex-wrap gap-2">
                     <form action={async (formData: FormData) => { "use server"; await markOrderCompleted(formData); }}><input type="hidden" name="orderId" value={order.id} /><button className="bg-acid border-2 border-ink px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-bubblegum">{order.sellerMarkedReadyAt ? "Update handoff ready" : "Mark handoff ready"}</button></form>
                     <form action={async (formData: FormData) => { "use server"; await reportBuyerNoPayment(formData); }}><input type="hidden" name="orderId" value={order.id} /><button className="border-2 border-bubblegum px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-bubblegum">Buyer did not pay</button></form>
                   </div>
                 </div>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
