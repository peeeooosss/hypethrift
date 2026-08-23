import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-black text-2xl mb-2">HypeThrift ⚡</div>
          <p className="text-sm text-gray-400 font-bold">Bid. Win. Flex. Repeat.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/seller/login" className="font-black hover:text-acid transition-colors">
            Seller Login
          </Link>
          <span className="text-ink/30">|</span>
          <Link href="/apply-seller" className="font-black hover:text-acid transition-colors">
            Sell with us
          </Link>
          <span className="text-ink/30">|</span>
          <Link href="/listings" className="font-black hover:text-acid transition-colors">
            Live Auctions
          </Link>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center mt-4">© 2026 HypeThrift. All drops authenticated. All bids final.</p>
    </footer>
  );
}
