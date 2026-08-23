import { prisma } from "@/lib/prisma";
import { approveSeller, rejectSeller } from "@/actions/admin-actions";

export default async function AdminSellersPage() {
  const [pending, approved] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SELLER", sellerStatus: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { sellerProfile: true },
    }),
    prisma.user.findMany({
      where: { role: "SELLER", sellerStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { sellerProfile: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase text-white">Seller Applications</h1>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Pending Approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 font-bold">No pending applications.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Seller</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Email</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Store</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">WhatsApp</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Location</th>
                <th className="pb-2 text-xs uppercase font-black text-gray-500">Applied</th>
                <th className="pb-2 text-xs uppercase font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id} className="border-b border-ink/10">
                  <td className="py-3 font-black">{u.name ?? "—"}</td>
                  <td className="py-3 text-sm">{u.email}</td>
                  <td className="py-3 text-sm font-black">{u.sellerProfile?.storeName ?? "—"}</td>
                  <td className="py-3 text-sm">{u.sellerProfile?.whatsappNumber ?? "—"}</td>
                  <td className="py-3 text-sm">{u.sellerProfile?.location ?? "—"}</td>
                  <td className="py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 text-right space-x-2">
                    <form action={approveSeller} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="bg-acid border-2 border-ink px-3 py-1 rounded-full text-xs font-black hover:shadow-brut-xs">Approve</button>
                    </form>
                    <form action={rejectSeller} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="bg-bubblegum border-2 border-ink px-3 py-1 rounded-full text-xs font-black hover:shadow-brut-xs">Reject</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Approved Sellers ({approved.length})</h2>
        <ul className="divide-y-2 divide-dashed divide-ink/20">
          {approved.map((u) => (
            <li key={u.id} className="py-3 flex justify-between items-center">
              <span className="font-black">{u.name ?? u.email}</span>
              <span className="text-xs font-bold uppercase text-gray-500">{u.email}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
