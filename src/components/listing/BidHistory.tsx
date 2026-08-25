"use client";

interface BidHistoryProps {
  bids: {
    id: string;
    amount: number;
    createdAt: Date;
    bidderId: string;
    bidder?: { name?: string | null } | null;
  }[];
  currentUserId?: string;
}

export default function BidHistory({ bids, currentUserId }: BidHistoryProps) {
  if (bids.length === 0) {
    return <p className="text-gray-500 font-bold">No bids yet. Be the first!</p>;
  }

  return (
    <ul className="divide-y divide-ink/10">
      {bids.map((b) => (
        <li
          key={b.id}
          className={b.bidderId === currentUserId ? "bg-acid/10" : ""}
        >
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-black">
                {b.bidderId === currentUserId ? "You" : b.bidder?.name ?? "Anonymous bidder"}
              </span>
              {b.bidderId === currentUserId && (
                <span className="ml-1 text-xs font-black text-acid">(you)</span>
              )}
            </div>
            <span className="font-black">₹{b.amount.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-xs text-gray-500 font-bold">
            {new Date(b.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}
