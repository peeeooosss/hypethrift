import { prisma } from "@/lib/prisma";
import Link from "next/link";

function money(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_CONTACT_FEE: "Contact fee required",
  WAITING_VERIFICATION: "Waiting for verification",
  CONTACT_FEE_PAID: "Contact fee paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalSellers,
    totalListings,
    totalOrders,
    totalCategories,
    pendingReviews,
    pendingSellers,
    revenueAgg,
    pendingRevenue,
    pendingContactFees,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.listing.count(),
    prisma.order.count(),
    prisma.category.count(),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.user.count({ where: { role: "SELLER", sellerStatus: "PENDING" } }),
    prisma.order.aggregate({
      where: { status: { in: ["CONTACT_FEE_PAID", "COMPLETED"] } },
      _sum: { platformFee: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PENDING_CONTACT_FEE", "WAITING_VERIFICATION"] } },
      _sum: { platformFee: true },
    }),
    prisma.order.count({
      where: { status: "WAITING_VERIFICATION" },
    }),
    prisma.order.findMany({
      where: { status: { in: ["CONTACT_FEE_PAID", "COMPLETED"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        finalPrice: true,
        status: true,
        createdAt: true,
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        listing: { select: { title: true, category: { select: { emoji: true, name: true } } } },
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum?.platformFee ?? 0;
  const pendingRevenueTotal = pendingRevenue._sum?.platformFee ?? 0;

  const cards = [
    { label: "Contact Fees", value: money(totalRevenue), href: "/admin/contact-fees", isCurrency: true },
    { label: "Total Orders", value: totalOrders.toString(), href: "/admin/orders" },
    { label: "Pending Review", value: pendingReviews.toString(), href: "/admin/listings" },
    { label: "Pending Seller Apps", value: pendingSellers.toString(), href: "/admin/sellers" },
    { label: "Active Listings", value: totalListings.toString(), href: "/admin/listings" },
    { label: "Fee Verifications", value: pendingContactFees.toString(), href: "/admin/contact-fees" },
    { label: "Total Users", value: totalUsers.toString(), href: "/admin/users" },
    { label: "Total Sellers", value: totalSellers.toString(), href: "/admin/sellers" },
    { label: "Total Categories", value: totalCategories.toString(), href: "/admin/categories" },
  ];

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-black uppercase text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white border-2 border-ink shadow-brut-md rounded-2xl p-5 hover:-translate-y-1 transition-transform"
          >
            <p className="text-4xl font-black">{c.value}</p>
            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Financial Summary</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border-2 border-ink/20 rounded-xl p-4 text-center">
            <span className="text-xs uppercase font-black text-gray-500">Total Revenue (Paid)</span>
            <p className="text-2xl font-black mt-1">{money(totalRevenue)}</p>
          </div>
          <div className="border-2 border-ink/20 rounded-xl p-4 text-center">
            <span className="text-xs uppercase font-black text-gray-500">Pending Payments</span>
            <p className="text-2xl font-black mt-1">{money(pendingRevenueTotal)}</p>
          </div>
          <div className="border-2 border-ink/20 rounded-xl p-4 text-center">
            <span className="text-xs uppercase font-black text-gray-500">Pending Payouts</span>
            <p className="text-2xl font-black mt-1">{pendingContactFees} orders</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 font-bold">No orders yet.</p>
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
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-ink/10">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{o.listing?.category?.emoji ?? "📦"}</span>
                      <span className="font-black text-sm">{o.listing?.title ?? "—"}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm">{o.buyer?.name ?? o.buyer?.email ?? "—"}</td>
                  <td className="py-3 text-sm">{o.seller?.name ?? o.seller?.email ?? "—"}</td>
                  <td className="py-3 text-sm font-black">{money(o.finalPrice)}</td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-1 rounded-xl text-xs font-black bg-gray-200">
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
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
