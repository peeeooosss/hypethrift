import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <div className="w-full max-w-lg rounded-[2rem] border-2 border-ink bg-white p-8 text-center shadow-brut-2xl">
        <p className="font-display text-7xl text-bubblegum">404</p>
        <h1 className="mt-2 font-display text-3xl uppercase">This rail is empty.</h1>
        <p className="mt-2 text-sm font-bold text-ink/50">The page moved, sold out or never existed.</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/" className="rounded-full border-2 border-ink bg-ink px-5 py-3 text-xs font-black uppercase text-white">
            Back to mall
          </Link>
          <Link href="/listings" className="rounded-full border-2 border-ink bg-acid px-5 py-3 text-xs font-black uppercase">
            Shop listings
          </Link>
        </div>
      </div>
    </main>
  );
}
