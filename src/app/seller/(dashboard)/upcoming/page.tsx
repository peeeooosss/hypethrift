import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { launchUpcoming, removeUpcoming, promoteDraftToUpcoming } from "@/actions/listing-actions";

export const revalidate = 0;

export default async function SellerUpcomingPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) redirect("/seller");

  const sellerId = session.user.id;
  const [upcomingListings, draftListings] = await Promise.all([
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
  ]);

  const upcomingCount = upcomingListings.length;
  const spotsLeft = 5 - upcomingCount;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase">⏳ Upcoming Showcase</h1>
        <Link
          href="/seller/listings/new"
          className="bg-ink text-white px-4 py-2 rounded-full text-xs font-black uppercase border-2 border-ink hover:bg-acid hover:text-ink transition-colors"
        >
          + New Drop
        </Link>
      </div>

      {/* How it works */}
      <div className="bg-bubblegum/10 border-2 border-bubblegum rounded-2xl p-5">
        <h2 className="font-black uppercase text-sm mb-2">How Upcoming Showcase works</h2>
        <ul className="text-xs font-bold text-gray-600 space-y-1">
          <li>1. Save listings as drafts, then promote up to <span className="font-black text-ink">5 items</span> to your Upcoming Showcase</li>
          <li>2. Buyers see your upcoming items on the homepage and vote &ldquo;Request Live&rdquo;</li>
          <li>3. When you&apos;re ready, spend 1 listing credit to launch an item live</li>
          <li>4. Upcoming listings are <span className="font-black text-ink">free</span> — no credits consumed until you launch</li>
        </ul>
      </div>

      {/* Slot counter */}
      <div className="flex items-center gap-4">
        <div className="bg-white border-2 border-ink shadow-brut-md rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-3xl font-black">{upcomingCount}</span>
          <span className="text-xs font-black uppercase text-gray-500">/ 5<br />slots used</span>
        </div>
        {spotsLeft > 0 ? (
          <span className="text-sm font-bold text-acid uppercase">
            {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} available
          </span>
        ) : (
          <span className="text-sm font-black uppercase text-red-500">
            Showcase full — launch or remove an item to free a spot
          </span>
        )}
      </div>

      {/* Upcoming items */}
      <section>
        <h2 className="text-xl font-black uppercase mb-4">Your Upcoming Items</h2>
        {upcomingListings.length === 0 ? (
          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="font-black text-lg mb-2">No upcoming items yet</p>
            <p className="text-sm text-gray-500 font-bold mb-4">
              Create a draft listing, then promote it to your showcase below.
            </p>
            <Link
              href="/seller/listings/new"
              className="inline-block bg-acid border-2 border-ink shadow-brut-md px-5 py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum transition-colors"
            >
              Create your first drop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingListings.map((l) => (
              <div key={l.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-5 flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  {l.images?.[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="w-20 h-20 rounded-xl border-2 border-ink object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-ink bg-gray-50 flex-shrink-0 flex items-center justify-center text-3xl">
                      {l.category.emoji}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-base leading-tight mb-1">{l.title}</h3>
                    <p className="text-xs text-gray-500 font-bold mb-2">
                      {l.category.emoji} {l.category.name} · ₹{(l.currentBid ?? l.startingBid).toLocaleString("en-IN")}
                    </p>
                    {l.startsAt && (
                      <p className="text-xs font-bold text-bubblegum">
                        📅 Scheduled: {new Date(l.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-acid/20 border-2 border-acid rounded-full px-3 py-1 text-xs font-black">
                    🔥 {l._count.upcomingVotes} buyer{l._count.upcomingVotes !== 1 ? "s" : ""} want this
                  </span>
                  <Link href={`/listing/${encodeURIComponent(l.id)}`} className="text-xs font-black text-gray-500 hover:text-ink ml-auto">
                    View page →
                  </Link>
                </div>

                <div className="flex gap-2 mt-auto pt-3 border-t-2 border-dashed border-ink/20">
                  <form action={async (formData: FormData) => { "use server"; await launchUpcoming(formData); }} className="flex-1">
                    <input type="hidden" name="listingId" value={l.id} />
                    <button
                      type="submit"
                      className="w-full bg-bubblegum border-2 border-ink px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-acid transition-colors"
                    >
                      🚀 Launch Live (1 credit)
                    </button>
                  </form>
                  <form action={async (formData: FormData) => { "use server"; await removeUpcoming(formData); }}>
                    <input type="hidden" name="listingId" value={l.id} />
                    <button
                      type="submit"
                      className="bg-white border-2 border-ink px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-bubblegum transition-colors"
                    >
                      ✕ Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promote from Drafts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase">📝 Promote from Drafts</h2>
          {spotsLeft > 0 && draftListings.length > 0 && (
            <span className="text-xs font-bold text-gray-500">
              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left — tap to add
            </span>
          )}
        </div>
        {draftListings.length === 0 ? (
          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6 text-center">
            <p className="text-gray-500 font-bold">
              No drafts available.{" "}
              <Link href="/seller/listings/new" className="font-black underline hover:text-ink">
                Create a new drop
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl divide-y-2 divide-dashed divide-ink/20">
            {draftListings.map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {l.images?.[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="w-12 h-12 rounded-lg border-2 border-ink object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg border-2 border-ink bg-gray-100 flex-shrink-0 flex items-center justify-center text-xl">
                      {l.category.emoji}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-black text-sm block truncate">{l.title}</span>
                    <span className="text-xs text-gray-500 font-bold">
                      {l.category.emoji} {l.category.name} · ₹{(l.startingBid).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {spotsLeft > 0 ? (
                    <form action={async (formData: FormData) => { "use server"; await promoteDraftToUpcoming(formData); }}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <button
                        type="submit"
                        className="bg-acid border-2 border-ink px-3 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-bubblegum transition-colors"
                      >
                        + Add to Upcoming
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs font-bold text-gray-400 uppercase">Full</span>
                  )}
                  <Link
                    href={`/seller/listings/${encodeURIComponent(l.id)}/edit`}
                    className="bg-white border-2 border-ink px-3 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-ink/5 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
