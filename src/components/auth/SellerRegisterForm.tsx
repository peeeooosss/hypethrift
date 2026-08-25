"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { sellerRegisterAction } from "@/actions/auth-actions";
import AgreementSections from "@/components/legal/AgreementSections";
import { SELLER_AGREEMENT } from "@/data/agreements";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full bg-ink text-white font-black uppercase text-lg py-4 rounded-2xl border-2 border-ink shadow-brut-lg hover:bg-acid hover:text-ink transition-colors disabled:opacity-60">
      {pending ? "Creating seller account..." : "Create seller account"}
    </button>
  );
}

export default function SellerRegisterForm() {
  const [state, formAction] = useActionState(sellerRegisterAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <p className="text-red-600 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl p-3">{state.error}</p>}
      <div>
        <label className="text-xs uppercase font-black text-gray-500 tracking-widest">Your name</label>
        <input name="name" required className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="Your full name" />
      </div>
      <div>
        <label className="text-xs uppercase font-black text-gray-500 tracking-widest">Email</label>
        <input name="email" type="email" required className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="seller@example.com" />
      </div>
      <div>
        <label className="text-xs uppercase font-black text-gray-500 tracking-widest">Password</label>
        <input name="password" type="password" minLength={6} required className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="At least 6 characters" />
      </div>
      <div>
        <label className="text-xs uppercase font-black text-gray-500 tracking-widest">Store name</label>
        <input name="storeName" required className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="e.g. Archive Room" />
      </div>
      <div>
        <label className="text-xs uppercase font-black text-gray-500 tracking-widest">WhatsApp number</label>
        <input name="whatsappNumber" required inputMode="tel" className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="10-digit number" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <input name="location" placeholder="City, State" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
        <input name="returnPolicy" placeholder="Return policy" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
      </div>
      <textarea name="storeDescription" rows={3} placeholder="Tell buyers what you sell..." className="w-full border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
      <AgreementSections sections={SELLER_AGREEMENT} heading="Seller agreement" fullHref="/agreements/seller" />
      <label className="flex items-start gap-3 text-sm font-bold">
        <input type="checkbox" name="agreementAccepted" required className="mt-1" />
        <span>I have read and accept the Seller Agreement.</span>
      </label>
      <SubmitButton />
      <p className="text-center text-sm font-bold text-gray-500">
        Already have a seller account? <Link href="/seller" className="underline text-ink">Seller login</Link>
      </p>
    </form>
  );
}
