import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { launchUpcoming, removeUpcoming, promoteDraftToUpcoming } from "@/actions/listing-actions";
import { FREE_LISTINGS } from "@/lib/platform";
import ShareButton from "@/components/seller/ShareButton";

export const revalidate = 0;

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) redirect("/seller");

  const sellerId = session.user.id;
  const [userRows, listings, upcomingListings, draftListings, totalBids, recentOrders] = await Promise.all([
    prisma.$queryRaw<{ listingCredits: number; freeListingsGranted: boolean }[]>`
      SELECT "listingCredits", "freeListingsGranted"
      FROM "User"
      WHERE id = ${sellerId}
      LIMIT 1
    `,
    prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { upcomingVotes: true } } },
    }),
    prisma.listing.findMany({
      where: { sellerId, status: "UPCOMING" },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: { select: { upcomingVotes: true } },
      },
    }),
    prisma.listing.findMany({
      where: { sellerId, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.bid.count({ where: { listing: { sellerId } } }),
    prisma.order.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const user = userRows[0];

  const upcomingCount = upcomingListings.length;
  const stats = [
    { label: "Listings", value: listings.length },
    { label: "Upcoming", value: upcomingCount },
    { label: "Drafts", value: draftListings.length },
    { label: "Total Bids", value: totalBids },
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

      {user?.freeListingsGranted && (
        <div className="bg-acid/15 border-2 border-acid rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-black uppercase text-sm">🎁 New seller bonus — first {FREE_LISTINGS} listings on us</p>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              {user.listingCredits} listing credit{user.listingCredits !== 1 ? "s" : ""} remaining.
              Use them before they&apos;re gone.
            </p>
          </div>
          <Link
            href="/seller/credits"
            className="bg-ink text-white border-2 border-ink px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-acid hover:text-ink transition-colors flex-shrink-0"
          >
            View credits
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border-2 border-ink shadow-brut-md rounded-2xl p-5">
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Showcase */}
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase">⏳ Upcoming Showcase</h2>
          <span className="text-xs font-black uppercase bg-bubblegum/30 border-2 border-bubblegum rounded-full px-3 py-1">
            {upcomingCount}/5 slots
          </span>
        </div>
        {upcomingListings.length === 0 ? (
          <p className="text-gray-500 font-bold">No upcoming items yet. Promote a draft below to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingListings.map((l) => (
              <div key={l.id} className="bg-ink/5 border-2 border-ink rounded-2xl p-4 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  {l.images?.[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="w-14 h-14 rounded-xl border-2 border-ink object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border-2 border-ink bg-white flex-shrink-0 flex items-center justify-center text-2xl">
                      {l.category.emoji}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm leading-tight truncate">{l.title}</h3>
                    <p className="text-xs text-gray-500 font-bold">{l.category.emoji} {l.category.name}</p>
                    {l.startsAt && (
                      <p className="text-xs font-bold text-bubblegum mt-1">
                        Starts: {new Date(l.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-black uppercase mb-3">
                  <span className="bg-acid/20 border-2 border-acid rounded-full px-2 py-1">
                    🔥 {l._count.upcomingVotes} requests
                  </span>
                  <Link href={`/listing/${encodeURIComponent(l.id)}`} className="text-gray-500 hover:text-ink">
                    View →
                  </Link>
                </div>

                <div className="flex gap-2 mt-auto">
                  <form action={async (formData: FormData) => { "use server"; await launchUpcoming(formData); }} className="flex-1">
                    <input type="hidden" name="listingId" value={l.id} />
                    <button
                      type="submit"
                      className="w-full bg-bubblegum border-2 border-ink px-3 py-2 rounded-xl text-xs font-black uppercase hover:bg-acid transition-colors"
                    >
                      🚀 Launch Live (1 credit)
                    </button>
                  </form>
                  <form action={async (formData: FormData) => { "use server"; await removeUpcoming(formData); }}>
                    <input type="hidden" name="listingId" value={l.id} />
                    <button
                      type="submit"
                      className="bg-white border-2 border-ink px-3 py-2 rounded-xl text-xs font-black uppercase hover:bg-bubblegum transition-colors"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Drafts */}
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase">📝 Saved Drafts</h2>
          {upcomingCount < 5 && draftListings.length > 0 && (
            <span className="text-xs font-bold text-gray-500">
              Tap &ldquo;Add to Upcoming&rdquo; to showcase a draft ({5 - upcomingCount} spots left)
            </span>
          )}
          {upcomingCount >= 5 && (
            <span className="text-xs font-black uppercase bg-red-100 border-2 border-red-300 text-red-600 rounded-full px-3 py-1">
              Showcase full — launch or remove an item first
            </span>
          )}
        </div>
        {draftListings.length === 0 ? (
          <p className="text-gray-500 font-bold">No drafts. Create a new drop to get started.</p>
        ) : (
          <div className="divide-y-2 divide-dashed divide-ink/20">
            {draftListings.map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {l.images?.[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="w-10 h-10 rounded-lg border-2 border-ink object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg border-2 border-ink bg-gray-100 flex-shrink-0 flex items-center justify-center text-lg">
                      {l.category.emoji}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-black text-sm block truncate">{l.title}</span>
                    <span className="text-xs text-gray-500 font-bold">{l.category.emoji} {l.category.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {upcomingCount < 5 ? (
                    <form action={async (formData: FormData) => { "use server"; await promoteDraftToUpcoming(formData); }}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <button
                        type="submit"
                        className="bg-acid border-2 border-ink px-3 py-1 rounded text-xs font-black uppercase hover:bg-bubblegum transition-colors"
                      >
                        + Add to Upcoming
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs font-bold text-gray-400 uppercase">Full</span>
                  )}
                  <Link
                    href={`/seller/listings/${encodeURIComponent(l.id)}/edit`}
                    className="bg-white border-2 border-ink px-3 py-1 rounded text-xs font-black uppercase hover:bg-ink/5 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Listings */}
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Recent Listings</h2>
        {listings.length === 0 ? (
          <p className="text-gray-500 font-bold">No listings yet. Create your first drop!</p>
        ) : (
          <ul className="divide-y-2 divide-dashed divide-ink/20">
            {listings.map((listing) => (
              <li key={listing.id} className="py-3 flex justify-between items-center gap-4">
                <span className="font-black">{listing.title}</span>
                <span className="flex items-center gap-3">
                  {["ACTIVE", "UPCOMING", "ENDED", "SOLD"].includes(listing.status) && (
                    <ShareButton
                      compact
                      listingId={listing.id}
                      title={listing.title}
                      price={listing.currentBid ?? listing.startingBid}
                      status={listing.status as string}
                    />
                  )}
                  <span className="text-xs font-bold uppercase text-gray-500">
                    {listing.status}
                    {listing.status === "UPCOMING" && ` · ${listing._count.upcomingVotes} requests`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
