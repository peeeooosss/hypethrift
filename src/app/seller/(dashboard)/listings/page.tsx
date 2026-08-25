import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteListing } from "@/actions/listing-actions";

export default async function SellerListingsPage() {
  const session = await auth();
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: session!.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.count({ where: { sellerId: session!.user.id } }),
  ]);

  const statusLabel = {
    ACTIVE: { label: "Live", color: "bg-acid text-ink" },
    PENDING_REVIEW: { label: "In Review", color: "bg-bubblegum text-ink" },
    DRAFT: { label: "Draft", color: "bg-gray-300 text-gray-800" },
    REJECTED: { label: "Rejected", color: "bg-ink text-white" },
    ENDED: { label: "Ended", color: "bg-gray-400 text-gray-800" },
    SOLD: { label: "Sold", color: "bg-blue-400 text-ink" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase">My Listings</h1>
        <Link
          href="/seller/listings/new"
          className="bg-ink text-white border-2 border-ink shadow-brut-md px-5 py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum hover:text-ink transition-colors"
        >
          + New Drop
        </Link>
      </div>

      <p className="text-sm font-bold text-gray-500 uppercase">{total} listings total</p>

      {listings.length === 0 ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
          <p className="text-gray-500 font-bold mb-4">You haven&apos;t created any listings yet.</p>
          <Link
            href="/seller/listings/new"
            className="inline-block bg-acid border-2 border-ink shadow-brut-md px-5 py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum transition-colors"
          >
            Create your first drop
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border-2 border-ink shadow-brut-lg rounded-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Item</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Bid</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Condition</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Size</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
                <th className="pb-3 text-xs uppercase font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const s = statusLabel[l.status as keyof typeof statusLabel] ?? statusLabel.DRAFT;
                return (
                  <tr key={l.id} className="border-b border-ink/10 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {l.images?.[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={l.images[0]}
                            alt={l.title}
                            className="w-12 h-12 rounded-xl border-2 border-ink object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl border-2 border-ink bg-gray-100 flex-shrink-0 flex items-center justify-center text-xl">
                            📦
                          </div>
                        )}
                        <span className="font-black">{l.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm font-black">₹{l.currentBid ?? l.startingBid}</td>
                    <td className="py-3 text-sm text-gray-600">{l.condition?.replace("_", " ") ?? "—"}</td>
                    <td className="py-3 text-sm font-black uppercase">{l.size ?? "—"}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 rounded-xl text-xs font-black ${s.color}`}>
                        {s.label}
                      </span>
                      {l.featured && <span className="ml-1 text-xs font-black">⭐</span>}
                    </td>
                    <td className="py-3 text-right">
                      <form action={deleteListing} className="inline">
                        <input type="hidden" name="listingId" value={l.id} />
                        <button
                          type="submit"
                          className="bg-ink text-white border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-bubblegum hover:text-ink"
                        >
                          ✕
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
