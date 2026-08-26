import { prisma } from "@/lib/prisma";
import { featureListing, unfeatureListing } from "@/actions/admin-actions";

export const revalidate = 0;

function money(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

const DURATION_OPTIONS = [1, 3, 7, 14, 30];

function timeLeft(until: Date) {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 48) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export default async function AdminFeaturedPage() {
  const now = new Date();

  const [activeListings, featured, charges] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", endsAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, category: { select: { emoji: true, name: true } } },
    }),
    prisma.listing.findMany({
      where: { featured: true },
      orderBy: [{ featuredUntil: "desc" }],
      include: { category: { select: { emoji: true, name: true } }, seller: { select: { name: true, email: true } } },
    }),
    prisma.featureCharge.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { listing: { select: { title: true } } },
    }),
  ]);

  const revenue = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase text-white">Featured Placements</h1>
      <p className="text-white/70 font-bold max-w-2xl">
        Featured listings appear as the ⚡ FEATURED DROP on the homepage and at the top of their category.
        Charge sellers for placement and record the amount below — it is added to your feature revenue.
      </p>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Feature a Listing</h2>
        <form action={async (formData: FormData) => { "use server"; await featureListing(formData); }} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Live listing</label>
            <select name="listingId" required defaultValue="" className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-black">
              <option value="" disabled>Select a live auction…</option>
              {activeListings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.category.emoji} {l.title} ({l.category.name})
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Duration</label>
            <select name="days" defaultValue={7} className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-black">
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[110px]">
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Charged (₹)</label>
            <input type="number" name="amount" min="0" defaultValue={0} className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-black" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Note (optional)</label>
            <input type="text" name="note" placeholder="e.g. paid via UPI" className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-bold" />
          </div>
          <button
            type="submit"
            className="bg-acid border-2 border-ink shadow-brut-md px-5 py-2 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum transition-colors"
          >
            Feature it
          </button>
        </form>
      </div>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">
          Currently Featured ({featured.filter((l) => l.featuredUntil && l.featuredUntil > now).length})
        </h2>
        {featured.length === 0 ? (
          <p className="text-gray-500 font-bold">No featured listings right now.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Listing</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Category</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Seller</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Placement</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {featured.map((l) => (
                <tr key={l.id} className={`border-b border-ink/10 ${!l.featuredUntil || l.featuredUntil <= now ? "opacity-50" : ""}`}>
                  <td className="py-3 font-black">{l.title}</td>
                  <td className="py-3 text-xs uppercase">{l.category.emoji} {l.category.name}</td>
                  <td className="py-3 text-xs">{l.seller.name ?? l.seller.email}</td>
                  <td className="py-3 text-xs font-black">
                    ⚡ Homepage + {l.category.name}
                    <br />
                    <span className={l.featuredUntil && l.featuredUntil > now ? "text-green-700" : "text-red-600"}>
                      {l.featuredUntil ? timeLeft(l.featuredUntil) : "No expiry"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <form action={unfeatureListing} className="inline">
                      <input type="hidden" name="listingId" value={l.id} />
                      <button className="bg-bubblegum border-2 border-ink px-3 py-1 rounded text-xs font-black hover:bg-acid hover:text-ink">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase">Feature Revenue</h2>
          <span className="bg-acid border-2 border-ink rounded-full px-4 py-1 text-sm font-black">{money(revenue)}</span>
        </div>
        {charges.length === 0 ? (
          <p className="text-gray-500 font-bold">No feature charges recorded yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Listing</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Amount</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Duration</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Note</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => (
                <tr key={c.id} className="border-b border-ink/10">
                  <td className="py-3 font-black text-sm">{c.listing.title}</td>
                  <td className="py-3 font-black text-sm">{money(c.amount)}</td>
                  <td className="py-3 text-xs">{c.days} days</td>
                  <td className="py-3 text-xs text-gray-500">{c.note ?? "—"}</td>
                  <td className="py-3 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
