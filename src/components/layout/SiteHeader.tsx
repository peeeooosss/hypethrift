"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, Search, ShoppingBag, Sparkles, User, X, Store } from "lucide-react";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Mall" },
  { href: "/listings", label: "Shop" },
  { href: "/brands", label: "Brands" },
  { href: "/bid-arena", label: "Bid Arena" },
];

export function SiteHeader({ liveCount }: { liveCount: number }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);
  const count = hydrated ? lines.length : 0;
  const accountHref =
    session?.user?.role === "ADMIN" ? "/admin" : session?.user?.role === "SELLER" ? "/seller/dashboard" : "/account";

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream/95 backdrop-blur-md">
        <div className="border-b border-ink/15 bg-ink px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white">
          <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse-live rounded-full bg-acid" />
          {liveCount} live drops · authenticated thrift · one-of-one finds
        </div>
        <div className="container-page flex h-16 items-center gap-3">
          <Link href="/" className="shrink-0 font-display text-xl uppercase tracking-tighter sm:text-2xl">
            Hype<span className="text-bubblegum">Thrift</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors hover:bg-ink hover:text-white",
                  link.href === "/bid-arena" && "text-bubblegum",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action="/listings" className="ml-auto hidden max-w-xs flex-1 items-center rounded-full border-2 border-ink bg-white px-3 md:flex">
            <Search className="h-4 w-4 shrink-0" />
            <input name="q" placeholder="Search the racks..." className="w-full bg-transparent px-2 py-2 text-xs font-bold outline-none placeholder:text-ink/35" />
          </form>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <Link href="/bid-arena" className="hidden items-center gap-1.5 rounded-full border-2 border-ink bg-bubblegum px-3 py-2 text-[10px] font-black uppercase shadow-brut-xs transition-colors hover:bg-acid sm:flex">
              <Sparkles className="h-3.5 w-3.5" /> Enter arena
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-white transition-colors hover:bg-acid"
              aria-label={`Bag with ${count} items`}
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-bubblegum px-1 text-[9px] font-black">
                  {count}
                </span>
              )}
            </button>
            <Link
              href={accountHref}
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-ink text-white transition-colors hover:bg-acid hover:text-ink"
            >
              <User className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-white lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t-2 border-ink bg-white px-4 py-3 lg:hidden">
            <form action="/listings" className="mb-3 flex items-center rounded-full border-2 border-ink bg-cream px-3">
              <Search className="h-4 w-4" />
              <input name="q" placeholder="Search the racks..." className="w-full bg-transparent px-2 py-2 text-xs font-bold outline-none" />
            </form>
            <nav className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border-2 border-ink px-3 py-2 text-xs font-black uppercase"
                >
                  {link.label}
                </Link>
              ))}
              <Link href={session?.user?.role === "SELLER" ? "/seller/dashboard" : "/sell"} onClick={() => setMenuOpen(false)} className="col-span-2 flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-acid px-3 py-2 text-xs font-black uppercase">
                <Store className="h-3.5 w-3.5" /> Sell with us
              </Link>
            </nav>
          </div>
        )}
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
