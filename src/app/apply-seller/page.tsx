import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { applyAsSeller } from "@/actions/seller-actions";
import { SELLER_AGREEMENT } from "@/data/agreements";
import AgreementSections from "@/components/legal/AgreementSections";

export default async function ApplySellerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { error } = await searchParams;

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
            {error === "complete-form" && (
              <p className="text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl py-2 px-3">
                Complete the required fields and accept the seller agreement.
              </p>
            )}
            <div>
              <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Store name</label>
              <input name="storeName" required className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. Archive Room" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">WhatsApp number</label>
              <input name="whatsappNumber" required inputMode="tel" className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="10-digit number" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Location</label>
                <input name="location" className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="City, State" />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Return policy</label>
                <input name="returnPolicy" className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="No returns / 7 days..." />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Store description</label>
              <textarea name="storeDescription" rows={3} className="w-full mt-1 bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="Tell buyers what you sell..." />
            </div>
            <AgreementSections sections={SELLER_AGREEMENT} heading="Seller agreement" fullHref="/agreements/seller" />
            <label className="flex items-start gap-3 text-sm font-bold">
              <input type="checkbox" name="agreementAccepted" required className="mt-1" />
              <span>I have read and accept the Seller Agreement, including the honesty and buyer-response requirements.</span>
            </label>
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
