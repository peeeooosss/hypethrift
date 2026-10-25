import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sell",
  description: "Open your storefront in the HypeThrift mall. List one-of-one pieces, run live auctions and sell direct.",
};

const steps = [
  ["01", "Build your store", "Pick a name, add your story and set your policies."],
  ["02", "List the piece", "Photos, condition, size, starting bid or Buy Now price."],
  ["03", "Go live", "Your rail appears in the mall, the shop floor and the arena."],
  ["04", "Get paid", "Buyers verify payment. You ship. Everyone moves on."],
];

export default async function SellPage() {
  const session = await auth();
  if (session?.user?.role === "SELLER") redirect("/seller/dashboard");

  return (
    <div className="bg-cream">
      <section className="border-b-2 border-ink bg-acid">
        <div className="container-page grid gap-8 py-14 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <Badge tone="ink">Seller access</Badge>
            <h1 className="mt-4 font-display text-6xl uppercase leading-[0.86] md:text-8xl">Your rail.<br />Our mall.</h1>
            <p className="mt-5 max-w-xl text-sm font-bold leading-relaxed text-ink/65">
              Open a storefront inside a living thrift mall. Auction the grails, set a Buy Now price on the everyday heat, and let buyers find you by walking past.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/seller" className="rounded-full border-2 border-ink bg-ink px-6 py-3.5 text-xs font-black uppercase text-white shadow-brut-md">
                Open seller portal
              </Link>
              <Link href="/agreements/seller" className="rounded-full border-2 border-ink bg-white px-6 py-3.5 text-xs font-black uppercase shadow-brut-md">
                Read seller agreement
              </Link>
            </div>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-ink/45">Admin approval required before your first listing.</p>
          </div>
          <div className="relative rounded-[2rem] border-2 border-ink bg-white p-5 shadow-brut-2xl">
            <div className="rounded-2xl border-2 border-ink bg-ink p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-acid">Storefront preview</p>
              <p className="mt-3 font-display text-4xl uppercase leading-none">Archive<br />Room</p>
              <p className="mt-2 text-xs font-bold text-white/50">Rare vintage · Mumbai</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {["Nike", "Levi's", "Prada", "Vintage"].map((item) => (
                  <div key={item} className="rounded-xl border-2 border-white/20 bg-white/5 p-3">
                    <p className="text-[9px] font-black uppercase text-white/40">{item}</p>
                    <p className="font-display text-lg uppercase">₹{(Math.floor(Math.random() * 8) + 2) * 1000}</p>
                  </div>
                ))}
              </div>
            </div>
            <span className="absolute -right-3 -top-3 rounded-full border-2 border-ink bg-bubblegum px-3 py-1 text-[10px] font-black uppercase">Live</span>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="font-display text-4xl uppercase">From signup to sold.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([number, title, copy]) => (
            <article key={number} className="rounded-3xl border-2 border-ink bg-white p-5 shadow-brut-sm">
              <p className="font-display text-4xl text-bubblegum">{number}</p>
              <h3 className="mt-2 text-sm font-black uppercase">{title}</h3>
              <p className="mt-2 text-xs font-bold leading-relaxed text-ink/50">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
