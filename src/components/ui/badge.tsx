import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "ink",
  className,
}: {
  children: ReactNode;
  tone?: "ink" | "acid" | "pink" | "aqua" | "lilac" | "white" | "gold";
  className?: string;
}) {
  const tones = {
    ink: "bg-ink text-white",
    acid: "bg-acid text-ink",
    pink: "bg-bubblegum text-ink",
    aqua: "bg-aqua text-ink",
    lilac: "bg-lilac text-ink",
    white: "bg-white text-ink",
    gold: "bg-gold text-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
