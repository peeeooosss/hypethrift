import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SELLER_PLANS, type SellerPlanId } from "@/lib/platform";
import { approveSubscription, rejectSubscription } from "@/actions/subscription-actions";

export const revalidate = 0;

export default async function AdminSubscriptionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [pending, recent] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { seller: { select: { name: true, email: true } } },
    }),
    prisma.subscription.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { seller: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">Admin</p>
        <h1 className="text-3xl font-black uppercase mt-1">Subscriptions</h1>
        <p className="text-gray-500 font-bold mt-2">Buy Now seller plans.</p>
      </div>

      <div className="bg-white border-2 border-ink rounded-3xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Pending Payments ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 font-bold">No pending subscription payments.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((sub) => {
              const plan = SELLER_PLANS[sub.plan as SellerPlanId];
              return (
                <div key={sub.id} className="border-2 border-ink rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black">
                        {sub.seller.name ?? "Seller"} — {plan.label} (₹{sub.amount})
                      </p>
                      <p className="text-xs font-bold text-gray-500">
                        {sub.seller.email} · {plan.listingLimit} Buy Now listings · requested {new Date(sub.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form action={approveSubscription}>
                        <input type="hidden" name="subscriptionId" value={sub.id} />
                        <button className="bg-acid border-2 border-ink rounded-xl px-4 py-2 font-black uppercase text-xs hover:bg-white transition-colors">
                          ✓ Approve
                        </button>
                      </form>
                      <form action={rejectSubscription}>
                        <input type="hidden" name="subscriptionId" value={sub.id} />
                        <button className="bg-bubblegum border-2 border-ink rounded-xl px-4 py-2 font-black uppercase text-xs hover:bg-white transition-colors">
                          ✕ Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-ink rounded-3xl p-6 overflow-x-auto">
        <h2 className="text-xl font-black uppercase mb-4">Recent Subscriptions</h2>
        {recent.length === 0 ? (
          <p className="text-gray-500 font-bold">No subscriptions yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Seller</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Plan</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Amount</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Valid Till</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((sub) => (
                <tr key={sub.id} className="border-b border-ink/10">
                  <td className="py-3 font-black">{sub.seller.name ?? "Seller"}</td>
                  <td className="py-3 font-black">{SELLER_PLANS[sub.plan as SellerPlanId].label}</td>
                  <td className="py-3 font-black">₹{sub.amount}</td>
                  <td className="py-3 text-xs font-black uppercase">{sub.status.replace("_", " ")}</td>
                  <td className="py-3 text-xs text-gray-500">{new Date(sub.endsAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}