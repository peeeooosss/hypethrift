import Link from "next/link";

export function MallTopBar({ backHref = "/", backLabel = "Enter 3D mall" }: { backHref?: string; backLabel?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="font-display text-xl uppercase tracking-tighter">
          Hype<span className="text-bubblegum">Thrift</span>
        </Link>
        <span className="hidden rounded-full border-2 border-ink bg-lilac px-2.5 py-1 text-[9px] font-black uppercase tracking-widest sm:inline-flex">
          Mall directory
        </span>
        <nav className="ml-auto flex items-center gap-2">
          <Link href="/mall" className="hidden rounded-full px-3 py-2 text-[10px] font-black uppercase hover:bg-ink hover:text-white sm:block">
            Directory
          </Link>
          <Link href="/listings" className="hidden rounded-full px-3 py-2 text-[10px] font-black uppercase hover:bg-ink hover:text-white sm:block">
            Shop
          </Link>
          <Link href="/bid-arena" className="rounded-full border-2 border-ink bg-bubblegum px-3 py-2 text-[10px] font-black uppercase shadow-brut-xs">
            Arena
          </Link>
          <Link href={backHref} className="rounded-full border-2 border-ink bg-ink px-3 py-2 text-[10px] font-black uppercase text-white">
            {backLabel} ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
