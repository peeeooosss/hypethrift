import { prisma } from "@/lib/prisma";

export default async function AdminSellersPage() {
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
      <h1 className="text-2xl font-black uppercase mb-4">Seller Applications</h1>
      <ul className="divide-y-2 divide-dashed divide-ink/20">
        {sellers.map((s) => (
          <li key={s.id} className="py-3 flex justify-between items-center">
            <span className="font-black">{s.name ?? s.email}</span>
            <span className="text-xs font-bold uppercase text-gray-500">{s.sellerStatus ?? "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
