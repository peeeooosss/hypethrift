import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/actions/admin-actions";

type OrderStatus = "PENDING_PAYMENT" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

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

const STATUS_OPTIONS = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-bubblegum text-ink",
  PAID: "bg-acid text-ink",
  SHIPPED: "bg-blue-400 text-ink",
  DELIVERED: "bg-green-400 text-ink",
  CANCELLED: "bg-gray-400 text-ink",
  REFUNDED: "bg-pink-400 text-ink",
};

type OrderWithDetails = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  finalPrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  buyer: { name: string | null; email: string } | null;
  seller: { name: string | null; email: string } | null;
  listing: { title: string; images: string[]; category: { emoji: string; name: string } | null } | null;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const statusFilter = (await searchParams).status;

  const orders = await prisma.order.findMany({
    where: statusFilter ? { status: statusFilter as OrderStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      listing: { include: { category: true } },
    },
  });

  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase text-white">Orders</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <a
          href="/admin/orders"
          className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${
            !statusFilter ? "bg-white text-ink" : "bg-transparent text-white"
          }`}
        >
          All ({orders.length})
        </a>
        {STATUS_OPTIONS.map((s) => {
          const count = statusCounts.find((sc) => sc.status === s)?._count._all ?? 0;
          return (
            <a
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${
                statusFilter === s ? "bg-white text-ink" : "bg-transparent text-white"
              }`}
            >
              {ORDER_STATUS_LABELS[s]} ({count})
            </a>
          );
        })}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-x-auto">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 font-bold">No orders found.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Item</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Buyer</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Seller</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Price</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Date</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
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
                  <td className="py-3 text-sm">{o.seller?.name ?? o.seller?.email ?? "—"}</td>
                  <td className="py-3 text-sm font-black">{money(o.finalPrice)}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-1 rounded-xl text-xs font-black ${STATUS_COLORS[o.status] ?? "bg-gray-300"}`}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 text-right">
                    <form action={updateOrderStatus} className="flex items-center gap-1">
                      <input type="hidden" name="orderId" value={o.id} />
                      <select
                        name="status"
                        defaultValue={o.status}
                        className="border-2 border-ink rounded px-2 py-1 text-xs font-black"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-ink text-white border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-acid hover:text-ink"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
