import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SELLER_PLANS, upiLinks, RETAIL_CONNECTION_FEE, type SellerPlanId } from "@/lib/platform";
import { getRetailQuota } from "@/lib/subscription";
import { requestSubscription } from "@/actions/subscription-actions";
import StoreSettingsForm from "@/components/seller/StoreSettingsForm";

export const revalidate = 0;

export default async function SellerPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/account");
  const { error } = await searchParams;

  const [profile, subscriptions] = await Promise.all([
    prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        planExpiresAt: true,
        storeName: true,
        storeDescription: true,
        storeSlug: true,
        storeLogo: true,
        instagramUrl: true,
        upiId: true,
      },
    }),
    prisma.subscription.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  const quota = await getRetailQuota(session.user.id);

  const errorMessages: Record<string, string> = {
    plan: "Invalid plan selected.",
    free: "The Free Trial plan does not need a payment.",
    pending: "You already have a subscription payment awaiting admin verification.",
    existing: "You are already on a plan with equal or more Buy Now listings.",
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">Seller tools</p>
        <h1 className="text-3xl font-black uppercase mt-1">Plan & Subscription</h1>
        <p className="text-gray-500 font-bold mt-2">
          Current plan: <span className="font-black text-ink">{SELLER_PLANS[quota.plan].label}</span>
          {quota.planExpiresAt ? <> (renews {quota.planExpiresAt.toLocaleDateString("en-IN")})</> : null}.
          You have <span className="font-black">{quota.used}/{quota.listingLimit}</span> Buy Now listings active.
        </p>
      </div>

      {error && errorMessages[error] && (
        <p className="text-red-600 font-black bg-red-50 border-2 border-red-200 rounded-xl py-3 px-4">{errorMessages[error]}</p>
      )}

      {quota.used >= quota.listingLimit && quota.plan !== "FREE" && (
        <p className="text-bubblegum font-black bg-bubblegum/10 border-2 border-bubblegum rounded-xl py-3 px-4">
          You have reached your Buy Now listing limit ({quota.used}/{quota.listingLimit}).
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {(Object.keys(SELLER_PLANS) as SellerPlanId[]).map((planId) => {
          const plan = SELLER_PLANS[planId];
          const current = quota.plan === planId;
          const currentPaid = current && plan.amount > 0;
          return (
            <div
              key={planId}
              className={`bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 flex flex-col ${current ? "ring-4 ring-acid" : ""}`}
            >
              <p className="text-xs uppercase font-black text-bubblegum tracking-widest">{plan.label}</p>
              <p className="text-3xl font-black mt-2">₹{plan.amount}</p>
              <p className="text-xs font-black uppercase text-gray-500 mb-1">
                {plan.amount === 0 ? "per month forever" : "per month"}
              </p>
              <ul className="text-sm font-bold text-gray-600 space-y-1 mb-4">
                <li>• {plan.listingLimit} Buy Now listings</li>
                <li>• No listing credits needed for retail</li>
                <li>• Your own store page</li>
              </ul>
              <div className="mt-auto">
                {current &&
                  (currentPaid ? (
                    <p className="text-center text-xs font-black uppercase bg-acid/20 border-2 border-acid rounded-xl py-3">
                      {quota.planExpiresAt ? `Active till ${quota.planExpiresAt.toLocaleDateString("en-IN")}` : "Active"}
                    </p>
                  ) : (
                    <p className="text-center text-xs font-black uppercase bg-ink/10 border-2 border-ink rounded-xl py-3">Current</p>
                  ))}
                {!current && (
                  <>
                    {plan.amount === 0 ? (
                      <p className="text-center text-xs font-black uppercase bg-ink/10 border-2 border-ink rounded-xl py-3">
                        Default plan
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <a href={upiLinks(plan.amount, `HypeThrift ${plan.label}`).paytm} className="text-center border-2 border-ink rounded-xl py-2 text-[10px] font-black uppercase hover:bg-acid">Paytm</a>
                          <a href={upiLinks(plan.amount, `HypeThrift ${plan.label}`).phonepe} className="text-center border-2 border-ink rounded-xl py-2 text-[10px] font-black uppercase hover:bg-acid">PhonePe</a>
                          <a href={upiLinks(plan.amount, `HypeThrift ${plan.label}`).googlePay} className="text-center border-2 border-ink rounded-xl py-2 text-[10px] font-black uppercase hover:bg-acid">GPay</a>
                        </div>
                        <form action={requestSubscription}>
                          <input type="hidden" name="plan" value={planId} />
                          <div className="grid grid-cols-2 gap-2">
                            <select name="paidVia" defaultValue="" required className="border-2 border-ink rounded-xl px-3 py-2 text-xs font-black uppercase">
                              <option value="">App</option>
                              <option value="Paytm">Paytm</option>
                              <option value="PhonePe">PhonePe</option>
                              <option value="Google Pay">Google Pay</option>
                            </select>
                            <button className="bg-bubblegum border-2 border-ink rounded-xl py-2 font-black uppercase text-xs hover:bg-acid transition-colors">
                              I Have Paid
                            </button>
                          </div>
                        </form>
                        <p className="text-[11px] text-gray-500 font-bold mt-2">Pay ₹{plan.amount} via any UPI app, then tap &apos;I Have Paid&apos; to share your screenshot on WhatsApp.</p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-ink text-white border-2 border-ink rounded-3xl p-5">
        <p className="font-black uppercase">How Buy Now works</p>
        <p className="text-sm font-bold text-gray-300 mt-1">
          Buyers pay the full item price and a ₹{RETAIL_CONNECTION_FEE} connection fee. HypeThrift is the trusted middleman:
          we verify payment, share the buyer's address with you, and track the delivery to ✓ your payout.
        </p>
      </div>

      <StoreSettingsForm
        storeName={profile?.storeName ?? ""}
        storeDescription={profile?.storeDescription ?? null}
        instagramUrl={profile?.instagramUrl ?? null}
        upiId={profile?.upiId ?? null}
        storeLogo={profile?.storeLogo ?? null}
        storeSlug={profile?.storeSlug ?? null}
      />

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 overflow-x-auto">
        <h2 className="text-xl font-black uppercase mb-4">Subscription History</h2>
        {subscriptions.length === 0 ? (
          <p className="text-gray-500 font-bold">No subscriptions yet. Your first month is on the free trial.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Plan</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Amount</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Valid Till</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-ink/10">
                  <td className="py-3 font-black">{SELLER_PLANS[sub.plan as SellerPlanId].label}</td>
                  <td className="py-3 font-black">₹{sub.amount}</td>
                  <td className="py-3 text-xs font-black uppercase">{sub.status.replace("_", " ")}</td>
                  <td className="py-3 text-xs text-gray-500 font-bold">{new Date(sub.endsAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}