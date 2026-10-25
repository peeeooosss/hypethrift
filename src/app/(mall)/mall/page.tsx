import type { Metadata } from "next";
import Link from "next/link";
import { MallTopBar } from "@/components/mall/MallTopBar";
import { getMallShowcase } from "@/lib/mall/showcase";
import { MALL_ZONES } from "@/lib/mall/zones";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mall Directory",
  description: "Browse all eight HypeThrift mall zones, from sneakers and streetwear to bags, denim and jewelry.",
};

export const revalidate = 20;

export default async function MallDirectoryPage() {
  const showcase = await getMallShowcase();

  return (
    <div className="min-h-screen bg-cream">
      <MallTopBar backLabel="Enter 3D mall" />
      <section className="border-b-2 border-ink bg-lilac">
        <div className="container-page py-14 md:py-20">
          <Badge tone="ink">Accessible directory · no WebGL required</Badge>
          <h1 className="mt-5 max-w-4xl font-display text-5xl uppercase leading-[0.9] md:text-7xl">
            Eight zones. One walkable thrift universe.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-relaxed text-ink/65">
            Explore every storefront, preview what is on the racks and jump straight into the product pages.
            The 3D mall is the experience — this directory is the shortcut.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border-2 border-ink bg-ink px-6 py-3 text-sm font-black uppercase text-white shadow-brut-md">
              Walk the mall ↗
            </Link>
            <Link href="/bid-arena" className="rounded-full border-2 border-ink bg-acid px-6 py-3 text-sm font-black uppercase shadow-brut-md">
              Enter Bid Arena
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="label">Storefronts</p>
            <h2 className="font-display text-3xl uppercase md:text-4xl">Choose a zone</h2>
          </div>
          <p className="hidden text-right text-[10px] font-black uppercase leading-relaxed text-ink/40 sm:block">
            Products update live<br />from active listings
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {MALL_ZONES.map((zone, index) => (
            <Link
              key={zone.slug}
              href={`/mall/${zone.slug}`}
              className="group flex min-h-72 flex-col overflow-hidden rounded-[1.75rem] border-2 border-ink bg-white shadow-brut-md transition-all duration-200 hover:-translate-y-1 hover:shadow-brut-lg"
            >
              <div className="flex items-start justify-between border-b-2 border-ink p-5" style={{ backgroundColor: zone.color }}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ink/50">Zone {String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-display text-2xl uppercase leading-none">{zone.name}</h3>
                </div>
                <span className="text-4xl transition-transform group-hover:rotate-12">{zone.emoji}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-bold leading-relaxed text-ink/55">{zone.tagline}</p>
                <ul className="mt-4 space-y-2">
                  {showcase[zone.slug].slice(0, 4).map((product) => (
                    <li key={`${zone.slug}-${product.title}`} className="flex items-center justify-between gap-3 border-b border-ink/10 pb-2 text-[11px] font-bold">
                      <span className="truncate">{product.title}</span>
                      <span className="shrink-0 font-mono text-[10px] text-ink/45">{money(product.price)}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-auto pt-5 text-[10px] font-black uppercase tracking-[0.18em]">Enter zone ↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-ink bg-ink p-8 text-white shadow-brut-lg md:p-12">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-bubblegum/30 blur-2xl" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Badge tone="pink">Live auction floor</Badge>
              <h2 className="mt-4 font-display text-4xl uppercase leading-none md:text-5xl">The Bid Arena is open.</h2>
              <p className="mt-3 max-w-xl text-sm font-bold text-white/55">Watch the bids climb, request upcoming drops and take home the grail.</p>
            </div>
            <Link href="/bid-arena" className="inline-flex rounded-full border-2 border-white bg-acid px-7 py-4 text-sm font-black uppercase text-ink shadow-brut-white">
              Enter arena ↗
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
