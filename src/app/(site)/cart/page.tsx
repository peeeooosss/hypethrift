"use client";

import Link from "next/link";
import { useCartStore, cartTotal } from "@/lib/cart-store";
import { buttonVariants } from "@/components/ui/button";
import { cn, money } from "@/lib/utils";
import { RETAIL_CONNECTION_FEE } from "@/lib/platform";

export default function CartPage() {
  const lines = useCartStore((state) => state.lines);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Your bag</p>
          <h1 className="mt-1 font-display text-5xl uppercase leading-none">Bag check.</h1>
        </div>
        <Link href="/listings?mode=retail" className={cn(buttonVariants({ variant: "secondary" }))}>
          Keep shopping
        </Link>
      </div>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border-2 border-ink bg-white p-12 text-center shadow-brut-md">
          <p className="text-7xl">🛍️</p>
          <h2 className="mt-4 font-display text-3xl uppercase">Nothing in the bag</h2>
          <p className="mt-2 text-sm font-bold text-ink/50">Every piece is one-of-one. If you like it, grab it.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/listings?mode=retail" className={cn(buttonVariants({ variant: "primary" }))}>Shop Buy Now</Link>
            <Link href="/listings?mode=auction" className={cn(buttonVariants({ variant: "secondary" }))}>Live auctions</Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {lines.map((line) => (
              <article key={line.listingId} className="flex gap-4 rounded-3xl border-2 border-ink bg-white p-4 shadow-brut-sm">
                <Link href={`/listing/${line.listingId}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-mall-floor">
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-3xl">✦</span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/listing/${line.listingId}`} className="font-display text-lg uppercase leading-tight hover:underline">{line.title}</Link>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-ink/45">
                        {line.seller ?? "Marketplace"}{line.zone ? ` · ${line.zone}` : ""}{line.size ? ` · Size ${line.size}` : ""}
                      </p>
                    </div>
                    <button onClick={() => remove(line.listingId)} className="text-xs font-black uppercase text-danger underline">Remove</button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                    <span className="font-mono text-lg font-bold">{money(line.price)}</span>
                    <Link href={`/checkout/retail/${encodeURIComponent(line.listingId)}`} className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
                      Checkout this item
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            <button onClick={clear} className="text-[10px] font-black uppercase text-ink/45 underline">Clear bag</button>
          </div>

          <aside className="h-fit rounded-3xl border-2 border-ink bg-white p-6 shadow-brut-md lg:sticky lg:top-24">
            <p className="label">Summary</p>
            <div className="mt-4 space-y-2 border-b-2 border-dashed border-ink/20 pb-4 text-sm font-bold">
              {lines.map((line) => (
                <div key={line.listingId} className="flex justify-between gap-3">
                  <span className="truncate text-ink/55">{line.title}</span>
                  <span className="font-mono">{money(line.price)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <span className="label">Subtotal</span>
              <span className="font-mono text-xl font-bold">{money(cartTotal(lines))}</span>
            </div>
            <p className="mt-3 rounded-xl border-2 border-dashed border-ink/20 bg-cream p-3 text-[10px] font-bold uppercase leading-relaxed text-ink/50">
              Each one-of-one piece is checked out with its seller. A {money(RETAIL_CONNECTION_FEE)} connection fee applies per order.
            </p>
            <Link href={`/checkout/retail/${encodeURIComponent(lines[0].listingId)}`} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-4 w-full")}>
              Checkout {lines.length > 1 ? "first item" : "bag"}
            </Link>
            {lines.length > 1 && <p className="mt-2 text-center text-[10px] font-black uppercase text-ink/40">Checkout items individually</p>}
          </aside>
        </div>
      )}
    </div>
  );
}
