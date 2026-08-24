import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SellerVerificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/seller/login");
  if (session.user.role !== "SELLER") redirect("/account");
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } });
  const approved = session.user.sellerStatus === "APPROVED";

  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
      <p className="text-xs uppercase tracking-widest font-black text-bubblegum">Seller account</p>
      <h1 className="text-2xl font-black uppercase mb-2">{approved ? "Account approved" : "Awaiting approval"}</h1>
      <p className="text-gray-500 font-bold">
        {approved ? "You can now create listings and manage connected orders." : "Admin is reviewing your seller profile. You can start listing after approval."}
      </p>
      {profile && <div className="mt-5 bg-ink/5 border-2 border-ink/20 rounded-xl p-4 text-sm font-bold space-y-1"><p>Store: {profile.storeName}</p><p>Email: {session.user.email}</p><p>WhatsApp: {profile.whatsappNumber}</p></div>}
    </div>
  );
}
