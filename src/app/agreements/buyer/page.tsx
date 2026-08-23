import Link from "next/link";
import AgreementSections from "@/components/legal/AgreementSections";
import { BUYER_AGREEMENT } from "@/data/agreements";

export default function BuyerAgreementPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/account/bids" className="text-sm font-black underline">← Back to My Bids</Link>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">HypeThrift terms</p>
        <h1 className="text-3xl font-black uppercase mt-1 mb-6">Buyer Agreement</h1>
        <AgreementSections sections={BUYER_AGREEMENT} heading="Please read carefully" scrollable={false} />
      </div>
    </div>
  );
}
