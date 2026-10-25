"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

export function AddToCartButton({
  listingId,
  title,
  price,
  image,
  size,
  seller,
  zone,
}: {
  listingId: string;
  title: string;
  price: number;
  image?: string | null;
  size?: string | null;
  seller?: string | null;
  zone?: string | null;
}) {
  const add = useCartStore((state) => state.add);
  const inCart = useCartStore((state) => state.lines.some((line) => line.listingId === listingId));
  const [justAdded, setJustAdded] = useState(false);

  return (
    <Button
      variant={inCart ? "acid" : "primary"}
      size="lg"
      className="w-full"
      onClick={() => {
        add({ listingId, title, price, image, size, seller, zone });
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1400);
      }}
    >
      {justAdded ? "Added to bag ✓" : inCart ? "In your bag ✓" : "Add to bag"}
    </Button>
  );
}
