import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSellerRetailOrders } from "@/lib/retail-data";
import { RETAIL_ORDER_STATUS_LABEL, type RetailOrderStatus } from "@/types/retail";

export const revalidate = 0;

export default async function SellerRetailOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/account");

  const orders = await getSellerRetailOrders(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">Seller tools</p>
        <h1 className="text-3xl font-black uppercase mt-1">Buy Now Orders</h1>
        <p className="text-gray-500 font-bold mt-2">
          {orders.length === 0
            ? "No Buy Now orders yet. They appear here once a buyer checks out."
            : `${orders.length} order${orders.length === 1 ? "" : "s"} in total.`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8 text-center">
          <p className="text-4xl mb-2">🛍️</p>
          <p className="font-black uppercase">No Buy Now orders yet</p>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Create a Buy Now or hybrid listing, and orders will show up here once buyers pay.
          </p>
          <Link href="/seller/listings/new" className="inline-block mt-4 bg-ink text-white border-2 border-ink shadow-brut-md px-5 py-2 rounded-xl font-black uppercase text-xs hover:bg-acid hover:text-ink transition-colors">
            New Drop
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  {order.listing.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.listing.images[0]} alt={order.listing.title} className="w-20 h-20 rounded-2xl border-2 border-ink object-cover" />
                  )}
                  <div>
                    <p className="font-black uppercase">{order.listing.title}</p>
                    <p className="text-sm font-bold text-gray-500">
                      Order #{order.id.slice(-8)} · {order.listing.size ?? "One Size"}
                    </p>
                    <p className="text-sm font-bold text-gray-500">
                      Buyer: {order.buyer.name ?? "Buyer"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-acid">₹{order.total}</p>
                  <p className="text-[11px] font-black uppercase text-gray-500">incl. ₹{order.connectionFee} fee</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-black uppercase text-gray-500 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "PENDING_PAYMENT",
                    "PAYMENT_VERIFIED",
                    "ADDRESS_RELEASED",
                    "PACKED",
                    "SHIPPED",
                    "DELIVERED",
                    "BUYER_CONFIRMED",
                    "COMPLETED",
                  ].map((s) => {
                    const idx = [
                      "PENDING_PAYMENT",
                      "PAYMENT_VERIFIED",
                      "ADDRESS_RELEASED",
                      "PACKED",
                      "SHIPPED",
                      "DELIVERED",
                      "BUYER_CONFIRMED",
                      "COMPLETED",
                    ].indexOf(order.status);
                    const stepIdx = [
                      "PENDING_PAYMENT",
                      "PAYMENT_VERIFIED",
                      "ADDRESS_RELEASED",
                      "PACKED",
                      "SHIPPED",
                      "DELIVERED",
                      "BUYER_CONFIRMED",
                      "COMPLETED",
                    ].indexOf(s);
                    return (
                      <span
                        key={s}
                        className={`text-[10px] font-black uppercase rounded-full px-3 py-1 border-2 ${
                          stepIdx < idx
                            ? "bg-acid/30 border-acid text-ink"
                            : stepIdx === idx
                              ? "bg-ink text-white border-ink"
                              : "bg-ink/5 border-ink/20 text-gray-400"
                        }`}
                      >
                        {RETAIL_ORDER_STATUS_LABEL[s as RetailOrderStatus]}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-gray-500 mt-2">
                  Payment: {order.status === "PENDING_PAYMENT" ? "awaiting buyer" : "verified by HypeThrift"}. We will share the delivery details with you when payment clears and the address is released.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}