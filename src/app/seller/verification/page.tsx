import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SellerVerificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/seller");
  if (session.user.role !== "SELLER") redirect("/account");
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } });
  const status = session.user.sellerStatus ?? "PENDING";
  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";
  const isPending = status === "PENDING";

  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
      <p className="text-xs uppercase tracking-widest font-black text-bubblegum">Seller account</p>
      <h1 className="text-2xl font-black uppercase mb-2">
        {isApproved ? "Account Approved" : isRejected ? "Application Rejected" : "Application Under Review"}
      </h1>
      <p className="text-gray-500 font-bold mb-4">
        {isApproved
          ? "You can now create listings and manage connected orders."
          : isRejected
          ? "Your seller application was not approved."
          : "Admin is reviewing your seller profile. You can start listing after approval."}
      </p>
      {isRejected && session.user.sellerNote && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm font-black text-red-700 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-600">{session.user.sellerNote}</p>
        </div>
      )}
      {isRejected && (
        <Link
          href="/seller/register?reapply=true"
          className="inline-block bg-bubblegum text-ink font-black uppercase px-6 py-3 rounded-full border-2 border-ink shadow-brut-md hover:bg-acid hover:text-ink transition-colors"
        >
          Re-apply as Seller
        </Link>
      )}
      {profile && (
        <div className="mt-5 bg-ink/5 border-2 border-ink/20 rounded-xl p-4 text-sm font-bold space-y-1">
          <p>Store: {profile.storeName}</p>
          <p>Email: {session.user.email}</p>
          <p>WhatsApp: {profile.whatsappNumber}</p>
          <p>Status: <span className="uppercase">{status}</span></p>
        </div>
      )}
      {isApproved && (
        <Link
          href="/seller"
          className="inline-block mt-5 bg-ink text-white border-2 border-ink px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink"
        >
          Go Back to Seller Login Page
        </Link>
      )}
    </div>
  );
}
