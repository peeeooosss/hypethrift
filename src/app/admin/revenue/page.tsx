import { prisma } from "@/lib/prisma";
import { getEligibleRetailPayouts } from "@/lib/retail-data";

export const revalidate = 0;

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function AdminRevenuePage() {
  const [auctionOrders, retailFees, retailComm, subs, credits, features, payouts, eligiblePayouts] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [{ status: "CONTACT_FEE_PAID" }, { status: "COMPLETED" }] },
      select: { platformFee: true },
    }),
    prisma.retailOrder.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { connectionFee: true },
    }),
    prisma.retailOrder.findMany({
      where: { status: "COMPLETED" },
      select: { commission: true, finalPrice: true },
    }),
    prisma.subscription.findMany({ select: { amount: true } }),
    prisma.creditPurchase.findMany({ where: { status: "COMPLETED" }, select: { amount: true } }),
    prisma.featureCharge.findMany({ select: { amount: true } }),
    prisma.payout.aggregate({ _sum: { amount: true } }),
    getEligibleRetailPayouts(),
  ]);

  const auctionFee = auctionOrders.reduce((s, o) => s + o.platformFee, 0);
  const retailFee = retailFees.reduce((s, o) => s + o.connectionFee, 0);
  const retailCommission = retailComm.reduce((s, o) => s + (o.commission ?? Math.round(o.finalPrice * 0.08)), 0);
  const subscriptionRevenue = subs.reduce((s, o) => s + o.amount, 0);
  const creditRevenue = credits.reduce((s, o) => s + o.amount, 0);
  const featureRevenue = features.reduce((s, o) => s + o.amount, 0);
  const totalRevenue = auctionFee + retailFee + retailCommission + subscriptionRevenue + creditRevenue + featureRevenue;
  const totalPayouts = payouts._sum.amount ?? 0;
  const payableToSellers = eligiblePayouts.reduce((s, p) => s + p.payout, 0);

  const rows = [
    { label: "Auction contact fees (₹69)", amount: auctionFee, count: auctionOrders.length },
    { label: "Buy Now handling fees (₹39)", amount: retailFee, count: retailFees.length },
    { label: "Buy Now commission (8%)", amount: retailCommission, count: retailComm.length },
    { label: "Seller plans", amount: subscriptionRevenue, count: subs.length },
    { label: "Listing credits", amount: creditRevenue, count: credits.length },
    { label: "Featured placements", amount: featureRevenue, count: features.length },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase text-white">Revenue</h1>
        <p className="text-white/70 font-bold mt-2">Everything HypeThrift collects, in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-acid border-2 border-ink rounded-2xl p-5">
          <p className="text-[10px] uppercase font-black">Gross revenue</p>
          <p className="text-3xl font-black mt-1">{money(totalRevenue)}</p>
        </div>
        <div className="bg-white border-2 border-ink rounded-2xl p-5">
          <p className="text-[10px] uppercase font-black">Paid to sellers (payouts)</p>
          <p className="text-3xl font-black mt-1">{money(totalPayouts)}</p>
        </div>
        <div className="bg-white border-2 border-ink rounded-2xl p-5">
          <p className="text-[10px] uppercase font-black">Unpaid to sellers</p>
          <p className="text-3xl font-black mt-1">{money(payableToSellers)}</p>
        </div>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-ink bg-ink/5">
          <h2 className="font-black uppercase">Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase font-black text-gray-500 border-b-2 border-ink/10">
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Count</th>
              <th className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-ink/10">
                <td className="px-6 py-3 font-black">{row.label}</td>
                <td className="px-6 py-3 font-bold text-gray-500">{row.count}</td>
                <td className="px-6 py-3 text-right font-black">{money(row.amount)}</td>
              </tr>
            ))}
            <tr className="bg-acid/20">
              <td className="px-6 py-3 font-black uppercase">Total</td>
              <td className="px-6 py-3" />
              <td className="px-6 py-3 text-right font-black">{money(totalRevenue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
        <h2 className="font-black uppercase mb-1">Ready to pay sellers</h2>
        <p className="text-sm font-bold text-gray-500 mb-4">
          Completed Buy Now orders whose payment has not been paid out yet. Create a payout on the Payouts page.
        </p>
        {eligiblePayouts.length === 0 ? (
          <p className="text-sm font-bold text-gray-500">Nothing due right now.</p>
        ) : (
          <div className="space-y-2">
            {eligiblePayouts.map((p) => (
              <div key={p.sellerId} className="flex flex-wrap items-center justify-between gap-3 bg-ink/5 border-2 border-ink/20 rounded-2xl px-4 py-3">
                <div>
                  <p className="font-black uppercase">{p.storeName}</p>
                  <p className="text-xs font-bold text-gray-500">{p.orders} order{p.orders === 1 ? "" : "s"} · {p.upiId ? `UPI: ${p.upiId}` : "no UPI on file"}</p>
                </div>
                <p className="font-black text-acid">{money(p.payout)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}