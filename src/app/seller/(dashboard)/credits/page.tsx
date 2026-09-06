import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LISTING_PACKAGES, upiLinks, FREE_LISTINGS } from "@/lib/platform";
import { requestListingCredits } from "@/actions/credit-actions";

export const revalidate = 0;

export default async function SellerCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/account");
  const { error } = await searchParams;

  const [profileRows, purchases] = await Promise.all([
    prisma.$queryRaw<{ listingCredits: number; freeListingsGranted: boolean }[]>`
      SELECT "listingCredits", "freeListingsGranted"
      FROM "User"
      WHERE id = ${session.user.id}
      LIMIT 1
    `,
    prisma.creditPurchase.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const profile = profileRows[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">Seller tools</p>
        <h1 className="text-3xl font-black uppercase mt-1">Listing Credits</h1>
        <p className="text-gray-500 font-bold mt-2">You have {profile?.listingCredits ?? 0} live listing credits.</p>
      </div>

      {error === "listing_credit_required" && (
        <p className="text-red-600 font-black bg-red-50 border-2 border-red-200 rounded-xl py-3 px-4">
          You need a listing credit to launch a drop. Buy credits below, then try again.
        </p>
      )}

      {profile?.freeListingsGranted && (
        <div className="bg-acid/15 border-2 border-acid rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-gray-700">
            🎁 Your first {FREE_LISTINGS} listings were part of your seller welcome bonus{profile.listingCredits > 0 ? " — you still have some left." : " — all used up."}
          </p>
          <span className="text-xs font-black uppercase bg-ink text-white rounded-full px-3 py-1 flex-shrink-0">
            {profile.listingCredits} left
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {LISTING_PACKAGES.map((item) => {
          const links = upiLinks(item.amount, `HypeThrift credits ${item.credits}`);
          return (
            <div key={item.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5">
              <p className="text-3xl font-black">{item.credits}</p>
              <p className="font-black uppercase">{item.label}</p>
              <p className="text-2xl font-black mt-3">₹{item.amount}</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <a href={links.paytm} className="text-center border-2 border-ink rounded-xl py-2 text-[10px] font-black uppercase hover:bg-acid">Paytm</a>
                <a href={links.phonepe} className="text-center border-2 border-ink rounded-xl py-2 text-[10px] font-black uppercase hover:bg-acid">PhonePe</a>
                <a href={links.googlePay} className="text-center border-2 border-ink rounded-xl py-2 text-[10px] font-black uppercase hover:bg-acid">GPay</a>
              </div>
              <form action={requestListingCredits} className="mt-3">
                <input type="hidden" name="packageId" value={item.id} />
                <select name="paidVia" defaultValue="" required className="w-full mb-2 border-2 border-ink rounded-xl px-3 py-2 text-xs font-black uppercase">
                  <option value="">Payment app used</option>
                  <option value="Paytm">Paytm</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Google Pay">Google Pay</option>
                </select>
                <button className="w-full bg-bubblegum border-2 border-ink rounded-xl py-3 font-black uppercase text-xs hover:bg-acid transition-colors">
                  I Have Paid
                </button>
              </form>
              <p className="text-[11px] text-gray-500 font-bold mt-2">You will be sent to WhatsApp to share your screenshot.</p>
            </div>
          );
        })}
      </div>

      <div className="bg-ink text-white border-2 border-ink rounded-3xl p-5">
        <p className="font-black uppercase">Payment account</p>
        <p className="text-sm font-bold text-gray-300 mt-1">UPI: 9864854481@ptsbi. Admin verifies your WhatsApp screenshot before credits are added.</p>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 overflow-x-auto">
        <h2 className="text-xl font-black uppercase mb-4">Purchase History</h2>
        {purchases.length === 0 ? <p className="text-gray-500 font-bold">No credit purchases yet.</p> : (
          <table className="w-full text-left">
            <thead><tr className="border-b-2 border-dashed border-ink/20">
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Package</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Amount</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Date</th>
            </tr></thead>
            <tbody>{purchases.map((purchase) => (
              <tr key={purchase.id} className="border-b border-ink/10">
                <td className="py-3 font-black">{purchase.package}</td>
                <td className="py-3 font-black">₹{purchase.amount}</td>
                <td className="py-3 text-xs font-black uppercase">{purchase.status.replace("_", " ")}</td>
                <td className="py-3 text-xs text-gray-500">{new Date(purchase.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
