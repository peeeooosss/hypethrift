import { prisma } from "@/lib/prisma";
import { approveCreditPurchase, rejectCreditPurchase } from "@/actions/credit-actions";

export const revalidate = 0;

export default async function AdminCreditsPage() {
  const purchases = await prisma.creditPurchase.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase text-white">Listing Credit Requests</h1>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-x-auto">
        {purchases.length === 0 ? <p className="p-8 text-gray-500 font-bold">No credit requests.</p> : (
          <table className="w-full text-left">
            <thead><tr className="border-b-2 border-dashed border-ink/20">
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Seller</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Package</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Amount</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Paid via</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500 text-right">Actions</th>
            </tr></thead>
            <tbody>{purchases.map((purchase) => (
              <tr key={purchase.id} className="border-b border-ink/10">
                <td className="py-3"><p className="font-black">{purchase.user.name ?? purchase.user.email}</p><p className="text-xs text-gray-500">{purchase.user.id}</p></td>
                <td className="py-3 font-black">{purchase.package} ({purchase.credits})</td>
                <td className="py-3 font-black">₹{purchase.amount}</td>
                <td className="py-3 text-xs uppercase">{purchase.paidVia ?? "UPI"}</td>
                <td className="py-3 text-xs font-black uppercase">{purchase.status.replace("_", " ")}</td>
                <td className="py-3 text-right space-x-2">
                  {purchase.status === "WAITING_VERIFICATION" && <>
                    <form action={approveCreditPurchase} className="inline"><input type="hidden" name="purchaseId" value={purchase.id} /><button className="bg-acid border-2 border-ink px-3 py-1 rounded-full text-xs font-black">Approve</button></form>
                    <form action={rejectCreditPurchase} className="inline"><input type="hidden" name="purchaseId" value={purchase.id} /><button className="bg-bubblegum border-2 border-ink px-3 py-1 rounded-full text-xs font-black">Reject</button></form>
                  </>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
