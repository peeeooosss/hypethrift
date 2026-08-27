"use client";

import Link from "next/link";
import { useActionState } from "react";
import { toggleRequestLive } from "@/actions/listing-actions";

export interface UpcomingItem {
  listingId: string;
  title: string;
  image: string | null;
  emoji: string;
  bg: string;
  sellerName: string;
  startsAtIso: string | null;
  voteCount: number;
  userVoted: boolean;
  isSeller: boolean;
  signedIn: boolean;
}

function formatStarts(startsAtIso: string | null) {
  if (!startsAtIso) return "Launch TBD";
  const d = new Date(startsAtIso);
  if (isNaN(d.getTime())) return "Launch TBD";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function UpcomingSection({ items }: { items: UpcomingItem[] }) {
  const [, formAction] = useActionState<{ live?: boolean } | null, FormData>(toggleRequestLive, null);

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pb-20">
      <div className="mb-6">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">⏳ Coming Up Next</h2>
        <p className="text-sm text-gray-500 font-bold mt-1">
          Pre-listings are free — hit &ldquo;Request Live&rdquo; to tell sellers what to launch next.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.listingId}
            className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-hidden flex flex-col"
          >
            <Link href={`/listing/${encodeURIComponent(item.listingId)}`} className="block">
              <div className={`aspect-square ${item.bg}`}>
                {item.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">{item.emoji}</div>
                )}
              </div>
              <div className="p-3 flex-1">
                <h3 className="font-black text-sm leading-tight mb-1 line-clamp-2">{item.title}</h3>
                <p className="text-xs text-gray-500 font-bold mb-2">by {item.sellerName}</p>
              </div>
            </Link>
            <div className="px-3 pb-3">
              <div className="flex items-center justify-between text-xs font-black uppercase mb-2">
                <span className="bg-bubblegum/30 border-2 border-bubblegum rounded-full px-2 py-1">
                  {formatStarts(item.startsAtIso)}
                </span>
                <span className="text-gray-500">🔥 {item.voteCount} want</span>
              </div>

              {item.isSeller ? (
                <p className="text-center text-xs font-black text-gray-500 uppercase">Your listing</p>
              ) : !item.signedIn ? (
                <Link
                  href="/login"
                  className="block text-center bg-ink text-white border-2 border-ink rounded-xl py-2 font-black uppercase text-xs hover:bg-acid hover:text-ink transition-colors"
                >
                  Request Live
                </Link>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="listingId" value={item.listingId} />
                  <button
                    type="submit"
                    className={`w-full text-center border-2 rounded-xl py-2 font-black uppercase text-xs transition-colors ${
                      item.userVoted
                        ? "bg-acid border-ink hover:bg-bubblegum"
                        : "bg-ink text-white border-ink hover:bg-acid hover:text-ink"
                    }`}
                  >
                    {item.userVoted ? "✓ Requested" : "Request Live"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
