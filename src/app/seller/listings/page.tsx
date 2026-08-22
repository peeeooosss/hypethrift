import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function SellerListingsPage() {
  const session = await auth();
  const listings = await prisma.listing.findMany({
    where: { sellerId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
      <h1 className="text-2xl font-black uppercase mb-4">All Listings</h1>
      {listings.length === 0 ? (
        <p className="text-gray-500 font-bold">No listings yet.</p>
      ) : (
        <ul className="divide-y-2 divide-dashed divide-ink/20">
          {listings.map((l) => (
            <li key={l.id} className="py-3 flex justify-between items-center">
              <span className="font-black">{l.title}</span>
              <span className="text-xs font-bold uppercase text-gray-500">{l.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
