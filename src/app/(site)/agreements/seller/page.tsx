import Link from "next/link";
import AgreementSections from "@/components/legal/AgreementSections";
import { SELLER_AGREEMENT } from "@/data/agreements";

export default function SellerAgreementPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/apply-seller" className="text-sm font-black underline">← Back to Seller Application</Link>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">HypeThrift terms</p>
        <h1 className="text-3xl font-black uppercase mt-1 mb-6">Seller Agreement</h1>
        <AgreementSections sections={SELLER_AGREEMENT} heading="Please read carefully" scrollable={false} />
      </div>
    </div>
  );
}
