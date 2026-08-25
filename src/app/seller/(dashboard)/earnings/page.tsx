import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function SellerEarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/account");

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { listingCredits: true } }),
    prisma.order.findMany({
      where: { sellerId: session.user.id, status: { in: ["CONTACT_FEE_PAID", "COMPLETED"] } },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true } } },
    }),
  ]);
  const totalDirectSales = orders.reduce((sum, order) => sum + order.finalPrice, 0);

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-black uppercase">Seller Earnings</h1><p className="text-gray-500 font-bold mt-2">HypeThrift does not take commission. Buyers pay you directly for items.</p></div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-acid border-2 border-ink shadow-brut-lg rounded-2xl p-5"><p className="text-xs uppercase font-black">Direct sales tracked</p><p className="text-3xl font-black mt-1">₹{totalDirectSales.toLocaleString("en-IN")}</p></div>
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-5"><p className="text-xs uppercase font-black text-gray-500">Completed orders</p><p className="text-3xl font-black mt-1">{orders.length}</p></div>
        <div className="bg-bubblegum border-2 border-ink shadow-brut-lg rounded-2xl p-5"><p className="text-xs uppercase font-black">Listing credits</p><p className="text-3xl font-black mt-1">{user?.listingCredits ?? 0}</p></div>
      </div>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-xl font-black uppercase">Buy more listing credits</h2><Link href="/seller/credits" className="bg-ink text-white px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-acid hover:text-ink">View packages</Link></div>
        <p className="text-sm text-gray-500 font-bold">Item payments happen directly between you and the buyer. This page is for your HypeThrift sales record only.</p>
      </div>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 overflow-x-auto">
        <h2 className="text-xl font-black uppercase mb-4">Sales history</h2>
        {orders.length === 0 ? <p className="text-gray-500 font-bold">No completed sales yet.</p> : <table className="w-full text-left"><thead><tr className="border-b-2 border-dashed border-ink/20"><th className="pb-3 text-xs uppercase font-black text-gray-500">Item</th><th className="pb-3 text-xs uppercase font-black text-gray-500">Amount</th><th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-ink/10"><td className="py-3 font-black">{order.listing.title}</td><td className="py-3 font-black">₹{order.finalPrice.toLocaleString("en-IN")}</td><td className="py-3 text-xs font-black uppercase">{order.status.replace("_", " ")}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
