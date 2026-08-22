import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { markOrderShipped, markOrderDelivered } from "@/actions/auction-actions";

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const revalidate = 0;

export default async function SellerOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(session.user.role)) redirect("/account");

  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { include: { category: true } },
      buyer: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase">Sold Orders</h1>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-x-auto">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 font-bold">No sold orders yet.</p>
            <p className="text-sm text-gray-500 font-bold mt-2">
              Orders from winning bids on your listings will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Item</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Buyer</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Price</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Ship To</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const addr = o.shippingAddress as {
                  line1?: string;
                  line2?: string;
                  city?: string;
                  state?: string;
                  pincode?: string;
                } | null;
                const canShip = o.status === "PAID";
                const canDeliver = o.status === "SHIPPED";
                return (
                  <tr key={o.id} className="border-b border-ink/10">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border-2 border-ink bg-gray-100 flex items-center justify-center text-lg">
                          {o.listing?.category?.emoji ?? "📦"}
                        </div>
                        <span className="font-black">{o.listing?.title ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm">{o.buyer?.name ?? o.buyer?.email ?? "—"}</td>
                    <td className="py-3 text-sm font-black">{money(o.finalPrice)}</td>
                    <td className="py-3">
                      <span className="inline-block px-2 py-1 rounded-xl text-xs font-black bg-gray-200">
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs">
                      {addr ? (
                        <>
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ""}
                          <br />
                          {addr.city}, {addr.state} — {addr.pincode}
                        </>
                      ) : (
                        <span className="text-gray-400">No address</span>
                      )}
                    </td>
                    <td className="py-3 text-right space-x-1">
                      {canShip && (
                        <form action={async (formData: FormData) => { await markOrderShipped(formData); }}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button
                            type="submit"
                            className="bg-acid border-2 border-ink px-3 py-1 rounded-full text-xs font-black hover:shadow-brut-xs"
                          >
                            Mark Shipped
                          </button>
                        </form>
                      )}
                      {canDeliver && (
                        <form action={async (formData: FormData) => { await markOrderDelivered(formData); }}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button
                            type="submit"
                            className="bg-ink text-white border-2 border-ink px-3 py-1 rounded-full text-xs font-black hover:bg-acid hover:text-ink"
                          >
                            Mark Delivered
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
