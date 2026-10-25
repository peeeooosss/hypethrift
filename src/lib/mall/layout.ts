import { MALL_ZONES, type ZoneSlug } from "./zones";

export interface StoreLayout {
  zone: ZoneSlug;
  position: [number, number, number];
  rotationY: number;
  side: "left" | "right";
}

const ROWS = [24, 10, -4, -18];

export const MALL_STORES: StoreLayout[] = MALL_ZONES.map((zone, index) => {
  const side = index % 2 === 0 ? "left" : "right";
  return {
    zone: zone.slug,
    position: [side === "left" ? -13 : 13, 0, ROWS[Math.floor(index / 2)]],
    rotationY: side === "left" ? Math.PI / 2 : -Math.PI / 2,
    side,
  };
});

export const MALL_BOUNDS = {
  minX: -18,
  maxX: 18,
  minZ: -27,
  maxZ: 34,
};

export const SPAWN_POSITION: [number, number] = [0, 32];
export const ARENA_POSITION: [number, number, number] = [0, 0, -26];

export const MALL_COLLIDERS = MALL_STORES.map((store) => ({
  minX: store.position[0] - (store.side === "left" ? 2.2 : 4.8),
  maxX: store.position[0] + (store.side === "left" ? 4.8 : 2.2),
  minZ: store.position[2] - 5.5,
  maxZ: store.position[2] + 5.5,
}));

export function collides(x: number, z: number, radius = 0.45) {
  if (x < MALL_BOUNDS.minX + radius || x > MALL_BOUNDS.maxX - radius) return true;
  if (z < MALL_BOUNDS.minZ + radius || z > MALL_BOUNDS.maxZ - radius) return true;
  return MALL_COLLIDERS.some(
    (box) =>
      x + radius > box.minX &&
      x - radius < box.maxX &&
      z + radius > box.minZ &&
      z - radius < box.maxZ,
  );
}
