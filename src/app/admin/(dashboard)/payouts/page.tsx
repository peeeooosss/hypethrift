import { prisma } from "@/lib/prisma";
import { updatePayoutStatus, createPayout, createRetailPayout } from "@/actions/admin-actions";
import { getEligibleRetailPayouts } from "@/lib/retail-data";

type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-bubblegum text-ink",
  PROCESSING: "bg-blue-400 text-ink",
  COMPLETED: "bg-acid text-ink",
  REJECTED: "bg-pink-400 text-ink",
};

type PayoutWithSeller = {
  id: string;
  sellerId: string;
  amount: number;
  status: string;
  method: string;
  createdAt: Date;
  updatedAt: Date;
  seller: { name: string | null; email: string } | null;
};

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payout?: string; error?: string }>;
}) {
  const { status: statusFilter, payout, error } = await searchParams;

  const [payouts, eligiblePayouts] = await Promise.all([
    prisma.payout.findMany({
      where: statusFilter ? { status: statusFilter as PayoutStatus } : undefined,
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { name: true, email: true } } },
    }),
    getEligibleRetailPayouts(),
  ]);

  const statusCounts = await prisma.payout.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase text-white">Payouts</h1>
      </div>

      {payout === "saved" && (
        <div className="bg-acid border-2 border-ink shadow-brut-md rounded-2xl px-5 py-4 font-black uppercase text-sm">
          Payout recorded — seller has been paid. 🎉
        </div>
      )}
      {error === "missing_seller" && <div className="bg-bubblegum text-white border-2 border-ink shadow-brut-md rounded-2xl px-5 py-4 font-black uppercase text-sm">Something went wrong. Try again.</div>}
      {error === "no_eligible_orders" && <div className="bg-bubblegum text-white border-2 border-ink shadow-brut-md rounded-2xl px-5 py-4 font-black uppercase text-sm">No eligible orders for that payout.</div>}

      <div className="flex gap-2 overflow-x-auto">
        <a
          href="/admin/payouts"
          className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${
            !statusFilter ? "bg-white text-ink" : "bg-transparent text-white"
          }`}
        >
          All ({payouts.length})
        </a>
        {STATUS_OPTIONS.map((s) => {
          const count = statusCounts.find((sc) => sc.status === s)?._count._all ?? 0;
          return (
            <a
              key={s}
              href={`/admin/payouts?status=${s}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${
                statusFilter === s ? "bg-white text-ink" : "bg-transparent text-white"
              }`}
            >
              {PAYOUT_STATUS_LABELS[s]} ({count})
            </a>
          );
        })}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-1">Retail payouts</h2>
        <p className="text-sm font-bold text-gray-500 mb-4">
          Pay each seller their Buy Now earnings for all completed, unpaid orders in one click.
        </p>
        {eligiblePayouts.length === 0 ? (
          <p className="text-sm font-bold text-gray-500">Nothing due right now.</p>
        ) : (
          <div className="space-y-2">
            {eligiblePayouts.map((p) => (
              <div key={p.sellerId} className="flex flex-wrap items-center justify-between gap-3 bg-ink/5 border-2 border-ink/20 rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <p className="font-black uppercase truncate">{p.storeName}</p>
                  <p className="text-xs font-bold text-gray-500">{p.orders} order{p.orders === 1 ? "" : "s"} · {p.upiId ? `UPI: ${p.upiId}` : "no UPI on file"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-black text-acid">₹{p.payout.toLocaleString("en-IN")}</p>
                  <form action={createRetailPayout}>
                    <input type="hidden" name="sellerId" value={p.sellerId} />
                    <button className="bg-acid border-2 border-ink shadow-brut-sm px-4 py-2 rounded-xl font-black uppercase text-xs hover:bg-bubblegum">
                      Pay out
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Manual Payout</h2>
        <form action={async (formData: FormData) => { "use server"; await createPayout(formData); }} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Seller ID</label>
            <input
              type="text"
              name="sellerId"
              required
              className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-black"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              required
              min="1"
              className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-black"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs uppercase font-black text-gray-500 mb-1">Method</label>
            <select
              name="method"
              defaultValue="bank"
              className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm font-black"
            >
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-acid border-2 border-ink shadow-brut-md px-5 py-2 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum transition-colors"
          >
            Create
          </button>
        </form>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-x-auto">
        {payouts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 font-bold">No payouts found.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Seller</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Amount</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Method</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Date</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-ink/10">
                  <td className="py-3 text-sm font-black">
                    {p.seller?.name ?? p.seller?.email ?? "—"}
                  </td>
                  <td className="py-3 text-sm font-black">{money(p.amount)}</td>
                  <td className="py-3 text-sm uppercase">{p.method}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-xl text-xs font-black ${
                        STATUS_COLORS[p.status] ?? "bg-gray-300"
                      }`}
                    >
                      {PAYOUT_STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 text-right">
                    <form action={updatePayoutStatus} className="flex items-center gap-1">
                      <input type="hidden" name="payoutId" value={p.id} />
                      <select
                        name="status"
                        defaultValue={p.status}
                        className="border-2 border-ink rounded px-2 py-1 text-xs font-black"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{PAYOUT_STATUS_LABELS[s]}</option>
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
