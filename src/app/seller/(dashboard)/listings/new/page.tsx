import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import NewListingForm from "@/components/seller/NewListingForm";

export default async function NewListingPage() {
  const [categories, session] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    auth(),
  ]);
  const seller = session?.user ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { listingCredits: true } }) : null;

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 bg-ink text-white rounded-2xl border-2 border-ink px-4 py-3">
        <p className="text-sm font-black uppercase">Live listing credits: {seller?.listingCredits ?? 0}</p>
        <Link href="/seller/credits" className="bg-acid text-ink px-3 py-2 rounded-xl text-xs font-black uppercase">Buy credits</Link>
      </div>
      <NewListingForm categories={categories} />
    </div>
  );
}
