import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn, money } from "@/lib/utils";

export interface ListingCardData {
  id: string;
  title: string;
  image?: string | null;
  emoji?: string;
  accent?: string;
  price: number;
  mode: "AUCTION" | "RETAIL" | "BOTH";
  meta?: string;
  size?: string | null;
  brand?: string | null;
  zone?: string | null;
  featured?: boolean;
}

export function ListingCard({
  listing,
  className,
  showMode = true,
}: {
  listing: ListingCardData;
  className?: string;
  showMode?: boolean;
}) {
  return (
    <Link
      href={`/listing/${encodeURIComponent(listing.id)}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-ink bg-white shadow-brut-md transition-all duration-200 hover:-translate-y-1 hover:shadow-brut-lg",
        className,
      )}
    >
      <div
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border-b-2 border-ink"
        style={{ backgroundColor: listing.accent ?? "#E9E4DB" }}
      >
        {listing.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-6xl transition-transform duration-500 group-hover:scale-110">
            {listing.emoji ?? "✦"}
          </span>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {showMode && (
            <Badge tone={listing.mode === "RETAIL" ? "aqua" : "pink"}>
              {listing.mode === "RETAIL" ? "Buy now" : listing.mode === "BOTH" ? "Bid / buy" : "Live"}
            </Badge>
          )}
          {listing.featured && <Badge tone="gold">Featured</Badge>}
        </div>
        {listing.zone && (
          <span className="absolute bottom-3 right-3 rounded-full border-2 border-ink bg-cream/90 px-2 py-1 text-[9px] font-black uppercase tracking-widest backdrop-blur">
            {listing.zone}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-black uppercase leading-tight tracking-tight">{listing.title}</h3>
          {listing.size && (
            <span className="shrink-0 rounded-full border-2 border-ink/20 px-2 py-0.5 text-[9px] font-black uppercase">
              {listing.size}
            </span>
          )}
        </div>
        {listing.brand && <p className="text-[10px] font-black uppercase tracking-widest text-ink/45">{listing.brand}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="font-mono text-lg font-bold leading-none">{money(listing.price)}</p>
            {listing.meta && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ink/45">{listing.meta}</p>}
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-acid text-lg font-black transition-transform group-hover:rotate-45">
            ↗
          </span>
        </div>
      </div>
    </Link>
  );
}
