import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/seller");

  const sellerId = session.user.id;
  const [listings, upcomingCount, totalBids, recentOrders] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { upcomingVotes: true } } },
    }),
    prisma.listing.count({ where: { sellerId, status: "UPCOMING" } }),
    prisma.bid.count({ where: { listing: { sellerId } } }),
    prisma.order.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Listings", value: listings.length },
    { label: "Upcoming", value: upcomingCount },
    { label: "Total Bids", value: totalBids },
    { label: "Orders", value: recentOrders.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase">Seller Dashboard</h1>
        <Link
          href="/seller/listings/new"
          className="bg-ink text-white px-4 py-2 rounded-full text-xs font-black uppercase border-2 border-ink hover:bg-acid hover:text-ink transition-colors"
        >
          + New Drop
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border-2 border-ink shadow-brut-md rounded-2xl p-5">
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Recent Listings</h2>
        {listings.length === 0 ? (
          <p className="text-gray-500 font-bold">No listings yet. Create your first drop!</p>
        ) : (
          <ul className="divide-y-2 divide-dashed divide-ink/20">
            {listings.map((listing) => (
              <li key={listing.id} className="py-3 flex justify-between items-center">
                <span className="font-black">{listing.title}</span>
                <span className="text-xs font-bold uppercase text-gray-500">
                  {listing.status}
                  {listing.status === "UPCOMING" && ` · ${listing._count.upcomingVotes} requests`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
