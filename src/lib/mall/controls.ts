"use client";

import { create } from "zustand";

interface MallControlState {
  moveX: number;
  moveZ: number;
  setMove: (x: number, z: number) => void;
  reset: () => void;
}

export const useMallControls = create<MallControlState>((set) => ({
  moveX: 0,
  moveZ: 0,
  setMove: (moveX, moveZ) => set({ moveX, moveZ }),
  reset: () => set({ moveX: 0, moveZ: 0 }),
}));
