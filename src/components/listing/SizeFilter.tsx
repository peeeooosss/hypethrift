"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getSizesForCategory } from "@/lib/sizes";

interface SizeFilterProps {
  categorySlug: string;
  availableSizes?: string[];
}

export default function SizeFilter({ categorySlug, availableSizes }: SizeFilterProps) {
  const router = useRouter();
  const search = useSearchParams();
  const pathname = usePathname();
  const available = availableSizes ?? getSizesForCategory(categorySlug);

  const selectedRaw = search.get("sizes");
  const selected = selectedRaw ? selectedRaw.split(",").filter(Boolean) : [];

  const toggle = (size: string) => {
    const next = selected.includes(size)
      ? selected.filter((s) => s !== size)
      : [...selected, size];
    const params = new URLSearchParams(search.toString());
    if (next.length === 0) {
      params.delete("sizes");
    } else {
      params.set("sizes", next.join(","));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!available || available.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-xs uppercase font-black text-gray-500 tracking-widest mb-2">Filter by size</p>
      <div className="flex flex-wrap gap-2">
        {available.map((s) => {
          const active = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-ink transition-colors ${
                active
                  ? "bg-ink text-white"
                  : "bg-white text-ink hover:bg-acid"
              }`}
            >
              {s}
            </button>
          );
        })}
        {selected.length > 0 && (
           <button
             type="button"
             onClick={() => {
               const params = new URLSearchParams(search.toString());
               params.delete("sizes");
               router.replace(`${pathname}?${params.toString()}`, { scroll: false });
             }}
            className="text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-ink bg-bubblegum text-ink hover:bg-ink hover:text-white"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
