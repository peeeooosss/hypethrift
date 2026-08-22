import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function SellerOverviewPage() {
  const session = await auth();
  const sellerId = session!.user.id;

  const [listings, totalBids, recentOrders] = await Promise.all([
    prisma.listing.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.bid.count({ where: { listing: { sellerId } } }),
    prisma.order.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Listings", value: listings.length },
    { label: "Total Bids", value: totalBids },
    { label: "Orders", value: recentOrders.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border-2 border-ink shadow-brut-md rounded-2xl p-5">
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black uppercase">Recent Listings</h2>
          <Link href="/seller/listings/new" className="bg-ink text-white px-4 py-2 rounded-full text-xs font-black uppercase border-2 border-ink hover:bg-acid hover:text-ink transition-colors">
            + New Drop
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="text-gray-500 font-bold">No listings yet. Create your first drop!</p>
        ) : (
          <ul className="divide-y-2 divide-dashed divide-ink/20">
            {listings.map((l) => (
              <li key={l.id} className="py-3 flex justify-between items-center">
                <span className="font-black">{l.title}</span>
                <span className="text-xs font-bold uppercase text-gray-500">{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
