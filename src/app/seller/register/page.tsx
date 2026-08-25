import Link from "next/link";
import SellerRegisterForm from "@/components/auth/SellerRegisterForm";

export default function SellerRegisterPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-lg bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black uppercase tracking-tighter">HypeThrift</Link>
          <h1 className="text-3xl font-black uppercase mt-4">Seller Onboarding Application</h1>
          <p className="text-sm text-gray-500 font-bold mt-1">Submit your store details for admin review. Approval is required before you can list items.</p>
        </div>
        <SellerRegisterForm />
      </div>
    </main>
  );
}
