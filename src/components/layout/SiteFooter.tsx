import Link from "next/link";

const columns = [
  {
    title: "Marketplace",
    links: [
      { href: "/listings?mode=auction", label: "Live auctions" },
      { href: "/listings?mode=retail", label: "Buy now" },
      { href: "/brands", label: "Brand directory" },
      { href: "/mall", label: "Mall directory" },
    ],
  },
  {
    title: "HypeThrift",
    links: [
      { href: "/sell", label: "Sell with us" },
      { href: "/agreements/buyer", label: "Buyer agreement" },
      { href: "/agreements/seller", label: "Seller agreement" },
      { href: "/account/support", label: "Support" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "My account" },
      { href: "/account/orders", label: "Orders" },
      { href: "/account/saved", label: "Saved" },
      { href: "/cart", label: "Your bag" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="font-display text-3xl uppercase tracking-tighter">
            Hype<span className="text-bubblegum">Thrift</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm font-bold leading-relaxed text-white/55">
            The walkable thrift mall for one-of-one finds. Bid in the arena, buy from the racks, flex forever.
          </p>
          <Link href="/bid-arena" className="mt-5 inline-flex rounded-full border-2 border-white bg-acid px-4 py-2 text-xs font-black uppercase text-ink shadow-brut-white">
            Enter the arena ↗
          </Link>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="label !text-white/35">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-bold text-white/70 transition-colors hover:text-acid">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        © 2026 HypeThrift · All drops authenticated · All bids final
      </div>
    </footer>
  );
}
