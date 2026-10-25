import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="container-page flex items-center justify-between py-5">
        <Link href="/" className="font-display text-2xl uppercase tracking-tighter">
          Hype<span className="text-bubblegum">Thrift</span>
        </Link>
        <Link href="/listings" className="rounded-full border-2 border-ink bg-white px-4 py-2 text-[10px] font-black uppercase shadow-brut-xs">
          ← Back to shop
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
