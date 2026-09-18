import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBuyerRetailOrders } from "@/lib/retail-data";
import { RETAIL_ORDER_STATUS_LABEL } from "@/types/retail";

export const revalidate = 0;

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function BuyerRetailOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect(session.user.role === "SELLER" ? "/seller" : "/admin");

  const orders = await getBuyerRetailOrders(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">My account</p>
        <h1 className="text-3xl font-black uppercase mt-1">Buy Now Orders</h1>
        <p className="text-gray-500 font-bold mt-2">
          {orders.length === 0 ? "You have no Buy Now orders yet." : `${orders.length} order${orders.length === 1 ? "" : "s"} total.`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8 text-center">
          <p className="text-4xl mb-2">🛍️</p>
          <p className="font-black uppercase">No Buy Now orders</p>
          <p className="text-sm font-bold text-gray-500 mt-1">Tap Buy Now on a listing to shop without the bidding.</p>
          <Link href="/listings" className="inline-block mt-4 bg-ink text-white border-2 border-ink shadow-brut-md px-5 py-2 rounded-xl font-black uppercase text-xs hover:bg-acid hover:text-ink transition-colors">
            Browse drops
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/retail-orders/${order.id}`} className="block bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 hover:shadow-brut-xl transition-shadow">
              <div className="flex items-center gap-4">
                {order.listing.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.listing.images[0]} alt={order.listing.title} className="w-20 h-20 rounded-2xl border-2 border-ink object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase truncate">{order.listing.title}</p>
                  <p className="text-sm font-bold text-gray-500">
                    Order #{order.id.slice(-8)} · {order.seller.sellerProfile?.storeName ?? "Seller"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-[10px] font-black uppercase rounded-full px-3 py-1 border-2 border-ink ${
                      order.status === "COMPLETED" ? "bg-acid text-ink" : order.status === "CANCELLED" ? "bg-gray-300 text-ink" : "bg-bubblegum text-white"
                    }`}>
                      {RETAIL_ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-xs font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-acid">{money(order.total)}</p>
                  <p className="text-[11px] font-bold text-gray-500">excluding payouts</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}