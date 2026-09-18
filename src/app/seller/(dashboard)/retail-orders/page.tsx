import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSellerRetailOrders } from "@/lib/retail-data";
import { markRetailDelivered, packRetailOrder, shipRetailOrder } from "@/actions/retail-actions";
import { RETAIL_ORDER_STATUS_LABEL, type RetailOrderStatus } from "@/types/retail";
import { formatAddress, whatsappUrl } from "@/lib/platform";
import RetailSellerOrderCard from "@/components/seller/RetailSellerOrderCard";

export const revalidate = 0;

export const RETAIL_SELLER_FLOW: RetailOrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_VERIFIED", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"];

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function SellerRetailOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/account");

  const orders = await getSellerRetailOrders(session.user.id);
  const pendingFulfillment = orders.filter((o) => ["PAYMENT_VERIFIED", "PACKED", "SHIPPED"].includes(o.status));
  const revenue = orders.filter((o) => o.status === "COMPLETED").reduce((sum, o) => sum + o.finalPrice, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase font-black text-bubblegum tracking-widest">Seller tools</p>
            <h1 className="text-3xl font-black uppercase mt-1">Buy Now Orders</h1>
          </div>
          {orders.length > 0 && (
            <div className="flex gap-2">
              <div className="bg-white border-2 border-ink rounded-2xl px-4 py-2 text-center">
                <p className="text-[10px] uppercase font-black text-gray-500">To fulfill</p>
                <p className="text-xl font-black">{pendingFulfillment.length}</p>
              </div>
              <div className="bg-white border-2 border-ink rounded-2xl px-4 py-2 text-center">
                <p className="text-[10px] uppercase font-black text-gray-500">Sold</p>
                <p className="text-xl font-black text-acid">{money(revenue)}</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-gray-500 font-bold mt-2">
          {orders.length === 0
            ? "No Buy Now orders yet. They appear here once a buyer checks out."
            : "Payments are verified by HypeThrift before your buyer's details are released to you."}
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
            <RetailSellerOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}