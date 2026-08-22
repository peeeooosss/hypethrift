import { prisma } from "@/lib/prisma";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
      <h1 className="text-2xl font-black uppercase mb-4">Listings</h1>
      <ul className="divide-y-2 divide-dashed divide-ink/20">
        {listings.map((l) => (
          <li key={l.id} className="py-3 flex justify-between items-center">
            <span className="font-black">{l.title}</span>
            <span className="text-xs font-bold uppercase text-gray-500">{l.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
