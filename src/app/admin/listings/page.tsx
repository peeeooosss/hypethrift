import { prisma } from "@/lib/prisma";
import {
  approveListing,
  rejectListing,
  toggleFeatured,
  deleteListing,
} from "@/actions/admin-actions";

export default async function AdminListingsPage() {
  const [pending, active, upcoming] = await Promise.all([
    prisma.listing.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "desc" }, include: { seller: true } }),
    prisma.listing.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, include: { seller: true } }),
    prisma.listing.findMany({
      where: { status: "UPCOMING" },
      orderBy: { createdAt: "desc" },
      include: { seller: true, _count: { select: { upcomingVotes: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase text-white">Listings</h1>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Pending Review ({pending.length})</h2>
        <ListingsTable items={pending} showModeration />
      </section>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Active ({active.length})</h2>
        <ListingsTable items={active} showModeration={false} />
      </section>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Upcoming Showcase ({upcoming.length})</h2>
        <UpcomingTable items={upcoming} />
      </section>
    </div>
  );
}

interface ListingsTableProps {
  items: Awaited<ReturnType<typeof prisma.listing.findMany<{ include: { seller: true } }>>>;
  showModeration: boolean;
}

function ListingsTable({ items, showModeration }: ListingsTableProps) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b-2 border-dashed border-ink/20">
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Image</th>
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Title</th>
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Seller</th>
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Bid</th>
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Status</th>
          {showModeration && <th className="pb-2 text-xs uppercase font-black text-gray-500">Moderate</th>}
          <th className="pb-2 text-xs uppercase font-black text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((l) => (
          <tr key={l.id} className="border-b border-ink/10">
            <td className="py-3">
              {l.images?.[0] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={l.images[0]}
                  alt={l.title}
                  className="w-12 h-12 rounded-xl border-2 border-ink object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl border-2 border-ink bg-gray-100 flex items-center justify-center text-xl">
                  📦
                </div>
              )}
            </td>
            <td className="py-3 font-black">{l.title}</td>
            <td className="py-3 text-xs">{l.seller.name ?? l.seller.email}</td>
            <td className="py-3 text-xs">₹{l.currentBid ?? l.startingBid}</td>
            <td className="py-3 text-xs uppercase">{l.status}</td>
            {showModeration && (
              <td className="py-3 text-xs space-x-1">
                {l.featured && <span className="text-acid font-black">⭐ Featured</span>}
                {l.verified && <span className="text-bubblegum font-black">✓ Verified</span>}
              </td>
            )}
            <td className="py-3 text-right space-x-1">
              {showModeration && (
                <>
                  <form action={approveListing} className="inline">
                    <input type="hidden" name="listingId" value={l.id} />
                    <button className="bg-acid border-2 border-ink px-2 py-1 rounded text-xs font-black">Approve</button>
                  </form>
                  <form action={rejectListing} className="inline">
                    <input type="hidden" name="listingId" value={l.id} />
                    <button className="bg-bubblegum border-2 border-ink px-2 py-1 rounded text-xs font-black">Reject</button>
                  </form>
                </>
              )}
              <form action={toggleFeatured} className="inline">
                <input type="hidden" name="listingId" value={l.id} />
                <button className={l.featured ? "bg-acid border-2 border-ink px-2 py-1 rounded text-xs font-black" : "border-2 border-ink px-2 py-1 rounded text-xs font-black"}>⭐</button>
              </form>
              <form action={deleteListing} className="inline">
                <input type="hidden" name="listingId" value={l.id} />
                <button className="bg-ink text-white border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-bubblegum hover:text-ink">✕</button>
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface UpcomingItem {
  id: string;
  title: string;
  images: string[];
  seller: { name: string | null; email: string };
  status: string;
  _count: { upcomingVotes: number };
}

function UpcomingTable({ items }: { items: UpcomingItem[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b-2 border-dashed border-ink/20">
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Image</th>
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Title</th>
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Seller</th>
          <th className="pb-2 text-xs uppercase font-black text-gray-500">Requests</th>
          <th className="pb-2 text-xs uppercase font-black text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((l) => (
          <tr key={l.id} className="border-b border-ink/10">
            <td className="py-3">
              {l.images?.[0] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={l.images[0]} alt={l.title} className="w-12 h-12 rounded-xl border-2 border-ink object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl border-2 border-ink bg-gray-100 flex items-center justify-center text-xl">📦</div>
              )}
            </td>
            <td className="py-3 font-black">{l.title}</td>
            <td className="py-3 text-xs">{l.seller.name ?? l.seller.email}</td>
            <td className="py-3 text-xs font-black">🔥 {l._count.upcomingVotes}</td>
            <td className="py-3 text-right space-x-1">
              <form action={rejectListing} className="inline">
                <input type="hidden" name="listingId" value={l.id} />
                <button className="bg-ink text-white border-2 border-ink px-2 py-1 rounded text-xs font-black">Remove</button>
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
