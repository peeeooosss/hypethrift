import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import SaveButton from "@/components/listing/SaveButton";

export const revalidate = 0;

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

function endsIn(minutes: number) {
  if (minutes <= 0) return "Ended";
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.floor(minutes % 60)}m`;
}

export default async function SavedItemsPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
        <p className="text-gray-500 font-bold mb-4">Sign in to view saved items.</p>
        <Link href="/login" className="inline-block bg-ink text-white px-5 py-3 rounded-2xl font-black uppercase text-sm border-2 border-ink hover:bg-acid hover:text-ink">
          Sign in
        </Link>
      </div>
    );
  }

  const saved = await prisma.savedItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { category: true } } },
  });

  if (saved.length === 0) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-black uppercase mb-2">Saved Items</h1>
        <p className="text-gray-500 font-bold">You haven&apos;t saved any items yet. Browse <Link href="/listings" className="underline font-black">live auctions</Link> and heart the ones you love!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black uppercase">Saved Items</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {saved.map((s) => {
          const l = s.listing;
          const mins = (new Date(l.endsAt).getTime() - Date.now()) / (1000 * 60);
          return (
            <div key={l.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-4 aspect-[4/5] flex flex-col relative">
              <div className="absolute top-2 right-2 z-10">
                <SaveButton listingId={l.id} initiallySaved={true} size="sm" />
              </div>
              <Link href={`/listing/${encodeURIComponent(l.id)}`} className="group">
                <div className="flex-1 flex items-center justify-center text-4xl mb-2">{l.category?.emoji ?? "📦"}</div>
                <h3 className="font-black text-sm uppercase text-center mb-2 line-clamp-2">{l.title}</h3>
                <div className="text-center">
                  <span className="font-black block text-lg">{money(l.currentBid ?? l.startingBid)}</span>
                  <span className="text-xs uppercase font-black text-gray-500">{l.bidCount} bids · {endsIn(mins)} left</span>
                </div>
                {l.size && (
                  <span className="mt-1 text-center text-xs font-black uppercase bg-ink/5 border border-ink/20 rounded-full py-1 px-2 block">
                    {l.size}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
