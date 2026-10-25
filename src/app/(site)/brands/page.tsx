import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS, BRAND_TIERS } from "@/data/brands";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Brands",
  description: "Shop the HypeThrift brand index: old money, heritage, streetwear, designer, contemporary and cult archive labels.",
};

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase() ?? "";
  const tier = params.tier ?? "";

  const filtered = BRANDS.filter((brand) => {
    const matchesTier = !tier || brand.tier === tier;
    const matchesQuery =
      !q ||
      brand.name.toLowerCase().includes(q) ||
      brand.category.toLowerCase().includes(q) ||
      brand.tagline.toLowerCase().includes(q);
    return matchesTier && matchesQuery;
  });

  return (
    <div className="bg-cream pb-20">
      <section className="border-b-2 border-ink bg-ink text-white">
        <div className="container-page py-14 md:py-20">
          <Badge tone="acid">The index</Badge>
          <h1 className="mt-5 max-w-4xl font-display text-6xl uppercase leading-[0.86] md:text-8xl">Know the label. Find the piece.</h1>
          <p className="mt-5 max-w-2xl text-sm font-bold leading-relaxed text-white/55">
            From old-money polo to Japanese archive, London streetwear and Indian couture. Browse every house the mall stocks.
          </p>
          <form action="/brands" className="mt-8 flex max-w-xl overflow-hidden rounded-full border-2 border-white bg-white">
            <input name="q" defaultValue={params.q ?? ""} placeholder="Search Nike, Prada, Kapital..." className="w-full bg-white px-5 py-3 text-sm font-bold text-ink outline-none" />
            {tier && <input type="hidden" name="tier" value={tier} />}
            <button className="bg-acid px-6 text-xs font-black uppercase text-ink">Search</button>
          </form>
        </div>
      </section>

      <div className="container-page py-8">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/brands${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={cn("rounded-full border-2 border-ink px-4 py-2 text-[10px] font-black uppercase", !tier ? "bg-ink text-white" : "bg-white")}>
            All labels
          </Link>
          {BRAND_TIERS.map((item) => {
            const next = new URLSearchParams({ tier: item });
            if (q) next.set("q", q);
            return (
              <Link key={item} href={`/brands?${next.toString()}`} className={cn("rounded-full border-2 border-ink px-4 py-2 text-[10px] font-black uppercase", tier === item ? "bg-ink text-white" : "bg-white")}>
                {item}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl uppercase">{q ? `Results for “${params.q}”` : tier || "Every label"}</h2>
          <span className="text-[10px] font-black uppercase text-ink/40">{filtered.length} brands</span>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border-2 border-ink bg-white p-12 text-center shadow-brut-md">
            <p className="text-6xl">🔎</p>
            <h3 className="mt-3 font-display text-3xl uppercase">No label found</h3>
            <p className="mt-2 text-sm font-bold text-ink/50">Try a broader search or clear the tier filter.</p>
            <Link href="/brands" className="mt-5 inline-flex rounded-full border-2 border-ink bg-acid px-5 py-3 text-xs font-black uppercase">Reset index</Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((brand) => (
              <Link key={brand.slug} href={`/brands/${brand.slug}`} className="group overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-brut-sm transition-transform hover:-translate-y-1">
                <div className="flex h-28 items-center justify-center border-b-2 border-ink p-4" style={{ backgroundColor: brand.accent }}>
                  <span className="text-center font-display text-2xl uppercase leading-[0.9] tracking-tight">{brand.name}</span>
                </div>
                <div className="p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-ink/40">{brand.category}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-ink/60">{brand.tagline}</span>
                    <span className="shrink-0 text-[9px] font-black uppercase">{brand.tier}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
