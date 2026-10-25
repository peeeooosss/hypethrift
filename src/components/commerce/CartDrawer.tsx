"use client";

import Link from "next/link";
import { useCartStore, cartTotal } from "@/lib/cart-store";
import { buttonVariants } from "@/components/ui/button";
import { cn, money } from "@/lib/utils";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lines = useCartStore((state) => state.lines);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-ink/45 backdrop-blur-sm" aria-label="Close bag" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l-2 border-ink bg-cream shadow-[-8px_0_0_#121212]">
        <header className="flex items-center justify-between border-b-2 border-ink p-5">
          <div>
            <p className="label">Your bag</p>
            <h2 className="font-display text-2xl uppercase">{lines.length} item{lines.length === 1 ? "" : "s"}</h2>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-white text-xl font-black">
            ×
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="text-6xl">🛍️</span>
              <h3 className="mt-4 font-display text-2xl uppercase">Bag is empty</h3>
              <p className="mt-1 text-sm font-bold text-ink/50">Find something worth flexing.</p>
              <Link href="/listings?mode=retail" onClick={onClose} className={cn(buttonVariants({ variant: "primary" }), "mt-5")}>
                Shop Buy Now
              </Link>
            </div>
          ) : (
            lines.map((line) => (
              <article key={line.listingId} className="flex gap-3 rounded-2xl border-2 border-ink bg-white p-3 shadow-brut-xs">
                <Link href={`/listing/${line.listingId}`} onClick={onClose} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-mall-floor">
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-2xl">✦</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-black uppercase leading-tight">{line.title}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-ink/45">{line.zone ?? "Marketplace"}{line.size ? ` · ${line.size}` : ""}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold">{money(line.price)}</span>
                    <button onClick={() => remove(line.listingId)} className="text-[10px] font-black uppercase text-danger underline">
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <footer className="space-y-3 border-t-2 border-ink bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="label">Subtotal</span>
              <span className="font-mono text-xl font-bold">{money(cartTotal(lines))}</span>
            </div>
            <p className="text-[10px] font-bold uppercase leading-relaxed text-ink/45">
              Each one-of-one item is checked out with its seller. Connection fee applies per order.
            </p>
            <Link href="/cart" onClick={onClose} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
              Review bag
            </Link>
            <button onClick={clear} className="w-full text-[10px] font-black uppercase text-ink/45 underline">
              Clear bag
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
