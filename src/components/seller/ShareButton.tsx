"use client";

import { useEffect, useState } from "react";
import { ShareIcon } from "@/components/ui/Icons";

const PUBLIC_STATUSES = ["ACTIVE", "UPCOMING", "ENDED", "SOLD"];

export default function ShareButton({
  listingId,
  title,
  price,
  status,
  compact = false,
}: {
  listingId: string;
  title: string;
  price: number;
  status?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/listing/${encodeURIComponent(listingId)}`);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanShare(true);
    }
  }, [listingId]);

  if (status && !PUBLIC_STATUSES.includes(status)) return null;

  const message = `🔥 ${title} on HypeThrift — starting at ₹${price.toLocaleString("en-IN")}. Bid now: ${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const baseCls = `inline-flex items-center gap-1.5 border-2 border-ink rounded-xl text-xs font-black uppercase transition-colors ${
    compact ? "px-2 py-1" : "px-3 py-1.5"
  }`;

  async function handleShare() {
    if (canShare && url) {
      try {
        await navigator.share({ title, text: message, url });
        return;
      } catch {
        // Fall through to clipboard if share dismissed/unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(url || `${window.location.origin}/listing/${encodeURIComponent(listingId)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={handleShare}
        className={`${baseCls} ${
          copied ? "bg-acid text-ink" : "bg-white text-ink hover:bg-acid"
        }`}
        aria-label="Share listing link"
      >
        <ShareIcon size={12} />
        {copied ? "Copied!" : "Share"}
      </button>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseCls} bg-bubblegum text-ink hover:bg-acid`}
        aria-label="Share on WhatsApp"
      >
        WhatsApp
      </a>
    </span>
  );
}
