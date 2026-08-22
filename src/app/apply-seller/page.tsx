import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { applyAsSeller } from "@/actions/seller-actions";

export default async function ApplySellerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sellerStatus: true, role: true },
  });

  if (user?.role === "SELLER" && user?.sellerStatus === "APPROVED") {
    redirect("/seller");
  }

  const isPending = user?.sellerStatus === "PENDING";

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-lg bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-8">
        <h1 className="text-3xl font-black uppercase text-center mb-2">Seller Application</h1>
        <p className="text-center text-sm text-gray-500 font-bold mb-6">
          {isPending
            ? "Your application is pending admin review. We’ll notify you once approved."
            : "Join as a seller and start listing your drops."}
        </p>

        {!isPending && (
          <form action={applyAsSeller} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Note (optional)</label>
              <textarea
                name="note"
                rows={4}
                placeholder="Tell us about your shop or what you’ll be selling..."
                className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm transition-shadow"
              />
            </div>
            <button className="w-full bg-ink text-white font-black uppercase text-lg py-4 rounded-2xl border-2 border-ink shadow-brut-lg hover:bg-acid hover:text-ink transition-colors">
              Submit Application
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 font-bold mt-6">
          Applications are reviewed by admin. You’ll gain access once approved.
        </p>
      </div>
    </div>
  );
}
