"use client";

import { useTransition, useState } from "react";
import { saveListingAction, unsaveListingAction } from "@/actions/account-actions";

interface SaveButtonProps {
  listingId: string;
  initiallySaved: boolean;
  size?: "sm" | "md";
}

export default function SaveButton({ listingId, initiallySaved, size = "md" }: SaveButtonProps) {
  const [saved, setSaved] = useState(initiallySaved);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (isPending) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("listingId", listingId);
      if (saved) {
        await unsaveListingAction(formData);
      } else {
        await saveListingAction(formData);
      }
      setSaved(!saved);
    });
  };

  const dim = size === "sm";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center rounded-full border-2 border-ink bg-white hover:bg-ink/5 transition-colors disabled:opacity-60 ${
        dim ? "w-7 h-7 text-sm" : "w-9 h-9 text-lg"
      }`}
      aria-label={saved ? "Unsave" : "Save"}
    >
      <span>{saved ? "💛" : "🤍"}</span>
    </button>
  );
}
