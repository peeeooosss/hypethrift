"use client";

import { useActionState, useEffect } from "react";
import { placeBid } from "@/actions/listing-actions";

interface BidFormProps {
  listingId: string;
  minimum: number;
}

export default function BidForm({ listingId, minimum }: BidFormProps) {
  const [state, action] = useActionState(placeBid, null);

  useEffect(() => {
    if (state?.error) {
      alert(state.error);
    }
  }, [state?.error]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      <div>
        <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">
          Your Bid (₹)
        </label>
        <input
          name="amount"
          type="number"
          required
          min={minimum}
          defaultValue={minimum}
          className="w-full bg-white border-2 border-ink rounded-xl px-4 py-3 font-black text-center text-2xl text-acid focus:outline-none focus:shadow-brut-sm"
        />
        <p className="text-xs text-gray-500 font-bold mt-1">Minimum bid: ₹{minimum}</p>
      </div>

      <button
        type="submit"
        className="w-full bg-ink text-white border-2 border-ink shadow-brut-md py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum hover:text-ink transition-colors"
      >
        Place Bid
      </button>
    </form>
  );
}
