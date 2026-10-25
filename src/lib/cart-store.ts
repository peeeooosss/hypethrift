"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  listingId: string;
  title: string;
  price: number;
  image?: string | null;
  size?: string | null;
  seller?: string | null;
  zone?: string | null;
  addedAt: number;
}

interface CartState {
  lines: CartLine[];
  hydrated: boolean;
  add: (line: Omit<CartLine, "addedAt">) => void;
  remove: (listingId: string) => void;
  clear: () => void;
  setHydrated: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hydrated: false,
      add: (line) =>
        set((state) => {
          if (state.lines.some((item) => item.listingId === line.listingId)) return state;
          return { lines: [{ ...line, addedAt: Date.now() }, ...state.lines] };
        }),
      remove: (listingId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.listingId !== listingId) })),
      clear: () => set({ lines: [] }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "hypethrift-cart-v1",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.price, 0);
}
