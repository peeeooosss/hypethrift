"use client";

import { useState } from "react";
import { UploadButton } from "@/components/ui/UploadThing";

interface ProofUploadProps {
  onUploadComplete: (url: string) => void;
}

export default function ProofUpload({ onUploadComplete }: ProofUploadProps) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {proofUrl ? (
        <div className="flex items-center gap-3">
          <img src={proofUrl} alt="Payment proof" className="w-20 h-20 rounded-xl border-2 border-ink object-cover" />
          <div>
            <p className="text-sm font-black text-green-700">Screenshot uploaded</p>
            <button
              type="button"
              onClick={() => { setProofUrl(null); onUploadComplete(""); }}
              className="text-xs font-bold text-red-500 underline mt-1"
            >
              Remove
            </button>
          </div>
          <input type="hidden" name="proofUrl" value={proofUrl} />
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">Upload a screenshot of your ₹69 payment (optional but recommended)</p>
          <UploadButton
            endpoint="proof"
            onClientUploadComplete={(res) => {
              const url = res?.[0]?.url;
              if (url) {
                setProofUrl(url);
                onUploadComplete(url);
              }
            }}
            appearance={{ button: "bg-ink text-white font-black uppercase text-xs py-2 px-4 rounded-xl border-2 border-ink ut-uploading:animate-pulse" }}
          />
        </div>
      )}
    </div>
  );
}
