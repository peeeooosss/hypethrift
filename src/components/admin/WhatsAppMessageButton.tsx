"use client";

import { useState } from "react";
import { CATEGORY_LABELS, type WhatsAppCategory, type WhatsAppMessage } from "@/lib/whatsapp-templates";
import { whatsappUrl } from "@/lib/platform";

const CATEGORY_ORDER: WhatsAppCategory[] = ["order", "payment", "instagram", "general"];

export default function WhatsAppMessageButton({
  number,
  messages,
  label = "WhatsApp",
  compact = false,
}: {
  number?: string | null;
  messages: WhatsAppMessage[];
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!number || messages.length === 0) {
    return <span className="text-xs font-bold text-gray-400">No WhatsApp</span>;
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${compact ? "px-2 py-1" : "px-3 py-2"} bg-green-300 border-2 border-ink rounded-full text-xs font-black uppercase hover:bg-acid`}
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-3">
          <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-ink/20 pb-2">
            <p className="text-xs font-black uppercase">Choose message</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-black underline">Close</button>
          </div>
          <div className="max-h-80 overflow-y-auto mt-2 space-y-3">
            {CATEGORY_ORDER.map((category) => {
              const categoryMessages = messages.filter((message) => message.category === category);
              if (categoryMessages.length === 0) return null;
              return (
                <section key={category}>
                  <p className="text-[10px] uppercase font-black text-gray-500 mb-1">{CATEGORY_LABELS[category]}</p>
                  <div className="space-y-1">
                    {categoryMessages.map((message) => (
                      <a
                        key={message.id}
                        href={whatsappUrl(number, message.text)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="block border-2 border-ink rounded-xl px-3 py-2 hover:bg-acid"
                      >
                        <p className="text-xs font-black">{message.label}</p>
                        <p className="text-[11px] leading-snug text-gray-600 mt-1 line-clamp-2 whitespace-pre-line">{message.text}</p>
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
