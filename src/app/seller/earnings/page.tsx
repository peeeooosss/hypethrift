import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { requestPayout } from "@/actions/seller-actions";

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

export const revalidate = 0;

export default async function SellerEarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(session.user.role)) redirect("/account");

  const userId = session.user.id;

  const [paidOrders, completedPayouts, pendingPayouts, processingPayouts] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: userId, status: "PAID" },
      select: { finalPrice: true },
    }),
    prisma.payout.findMany({
      where: { sellerId: userId, status: "COMPLETED" },
      select: { amount: true, createdAt: true },
    }),
    prisma.payout.findMany({
      where: { sellerId: userId, status: "PENDING" },
      select: { amount: true, createdAt: true, id: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.findMany({
      where: { sellerId: userId, status: "PROCESSING" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPaid = paidOrders.reduce((sum, o) => sum + o.finalPrice, 0);
  const totalPaidOut = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
  const pending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const processing = processingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const available = totalPaid - totalPaidOut - pending - processing;
  const platformFee = Math.round(available * 0.1);
  const payoutAmount = Math.max(0, available - platformFee);

  const PAYOUT_STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
  };

  const allPayouts = await prisma.payout.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase">Earnings & Payouts</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-ink text-white border-2 border-ink shadow-brut-lg rounded-2xl p-6 text-center">
          <span className="text-xs uppercase font-black text-gray-300">Total Earnings</span>
          <p className="text-3xl font-black mt-1">{money(totalPaid)}</p>
        </div>
        <div className="bg-acid text-ink border-2 border-ink shadow-brut-lg rounded-2xl p-6 text-center">
          <span className="text-xs uppercase font-black">Available to Withdraw</span>
          <p className="text-3xl font-black mt-1">{money(available)}</p>
          <p className="text-xs text-gray-600 mt-1">Platform fee (10%): {money(platformFee)}</p>
        </div>
        <div className="bg-bubblegum border-2 border-ink shadow-brut-lg rounded-2xl p-6 text-center">
          <span className="text-xs uppercase font-black text-ink">Pending Payouts</span>
          <p className="text-3xl font-black mt-1 text-ink">{money(pending + processing)}</p>
          <p className="text-xs text-gray-600 mt-1">
            {pendingPayouts.length} pending, {processingPayouts.length} processing
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Request Payout</h2>
        {payoutAmount <= 0 ? (
          <p className="text-gray-500 font-bold">
            No earnings available to withdraw yet.
          </p>
        ) : (
          <form action={async () => { await requestPayout(); }}>
            <div className="flex items-center justify-between p-4 bg-ink/5 border-2 border-ink/20 rounded-xl">
              <div>
                <p className="font-black">Available: {money(available)}</p>
                <p className="text-xs text-gray-500">
                  Platform fee (10%): {money(platformFee)} · You receive: {money(payoutAmount)}
                </p>
              </div>
              <button
                type="submit"
                className="bg-ink text-white border-2 border-ink px-5 py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
              >
                Request ₹{payoutAmount.toLocaleString("en-IN")}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Payout History</h2>
        {allPayouts.length === 0 ? (
          <p className="text-gray-500 font-bold">No payouts requested yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Date</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Amount</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Method</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {allPayouts.map((p) => (
                <tr key={p.id} className="border-b border-ink/10">
                  <td className="py-3 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 text-sm font-black">{money(p.amount)}</td>
                  <td className="py-3 text-sm uppercase">{p.method}</td>
                  <td className="py-3">
                    <span className="inline-block px-2 py-1 rounded-xl text-xs font-black bg-gray-200">
                      {PAYOUT_STATUS_LABELS[p.status] ?? p.status}
                    </span>
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
