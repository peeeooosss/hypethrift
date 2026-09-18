"use client";

import { useState } from "react";
import { useActionState } from "react";
import { UploadButton } from "@/components/ui/UploadThing";
import { updateStoreSettings } from "@/actions/store-actions";

interface StoreSettingsFormProps {
  storeName: string;
  storeDescription: string | null;
  instagramUrl: string | null;
  upiId: string | null;
  storeLogo: string | null;
  storeSlug: string | null;
}

export default function StoreSettingsForm(props: StoreSettingsFormProps) {
  const [logo, setLogo] = useState<string>(props.storeLogo ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverState, formAction] = useActionState(updateStoreSettings, null);

  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
      <h2 className="text-xl font-black uppercase mb-1">Your Storefront</h2>
      <p className="text-sm font-bold text-gray-500 mb-4">
        {props.storeSlug ? (
          <>Your store lives at <span className="font-black text-ink">/store/{props.storeSlug}</span></>
        ) : (
          "Your store page link will be generated from your store name."
        )}
      </p>

      {serverState?.error && (
        <p className="mb-4 text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl py-2 px-3">{serverState.error}</p>
      )}
      {serverState?.success && (
        <p className="mb-4 text-acid text-sm font-bold bg-acid/20 border-2 border-acid rounded-xl py-2 px-3">Store settings saved!</p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="storeLogo" value={logo} />

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Store Name</label>
          <input name="storeName" type="text" required minLength={2} maxLength={30} defaultValue={props.storeName}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
            placeholder="e.g. Street Vault" />
          <p className="text-[11px] text-gray-500 font-bold mt-1">Shown on your store page and next to your drops.</p>
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Store Description</label>
          <textarea name="storeDescription" rows={3} defaultValue={props.storeDescription ?? ""}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
            placeholder="What does your store specialise in?" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Store Logo</label>
          </div>
          {uploadError && (
            <p className="mb-3 text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl py-2 px-3">
              Upload failed: {uploadError}
            </p>
          )}
          {logo && (
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="store logo" className="w-16 h-16 rounded-2xl border-2 border-ink object-cover" />
              <button
                type="button"
                onClick={() => setLogo("")}
                className="text-xs font-black uppercase border-2 border-ink rounded-xl px-3 py-2 hover:bg-bubblegum transition-colors"
              >
                Remove
              </button>
            </div>
          )}
          {!logo && (
            <UploadButton
              endpoint="images"
              onClientUploadComplete={(res) => {
                setUploadError(null);
                const url = res?.[0]?.url;
                if (url) setLogo(url);
              }}
              onUploadError={(err) => setUploadError(err.message || "Upload failed. Try again.")}
            />
          )}
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Instagram Link</label>
          <input name="instagramUrl" type="url" defaultValue={props.instagramUrl ?? ""}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
            placeholder="https://instagram.com/yourstore" />
          <p className="text-[11px] text-gray-500 font-bold mt-1">Optional — shown on your store page. Buyers follow you directly.</p>
        </div>

        <div>
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-widest mb-1">Payments UPI ID (for collecting sale payments)</label>
          <input name="upiId" type="text" defaultValue={props.upiId ?? ""}
            className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:shadow-brut-sm"
            placeholder="yourname@okaxis" />
          <p className="text-[11px] text-gray-500 font-bold mt-1">HypeThrift handles payments for now — this is reserved for direct payouts later.</p>
        </div>

        <button
          type="submit"
          className="w-full bg-ink text-white border-2 border-ink shadow-brut-lg py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
        >
          Save Store Settings
        </button>
      </form>
    </div>
  );
}