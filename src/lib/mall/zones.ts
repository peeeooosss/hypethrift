export type ZoneSlug =
  | "sneakers"
  | "streetwear"
  | "vintage"
  | "bags"
  | "accessories"
  | "denim"
  | "jewelry"
  | "outerwear";

export interface MallZone {
  slug: ZoneSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  emoji: string;
  color: string;
  textColor: string;
  products: string[];
}

export const MALL_ZONES: MallZone[] = [
  {
    slug: "sneakers",
    name: "Sneaker Yard",
    shortName: "Sneakers",
    tagline: "Deadstock energy. Zero restocks.",
    description: "Grails, beaters and everything worth queuing for. Every pair checked before it hits the floor.",
    emoji: "👟",
    color: "#FF66B2",
    textColor: "#121212",
    products: ["Grail runner", "High-top", "Court classic", "Chunky sole"],
  },
  {
    slug: "streetwear",
    name: "Streetwear Block",
    shortName: "Streetwear",
    tagline: "Loud fits, quiet flex.",
    description: "Graphic tees, heavyweight hoodies and the pieces that make the group chat ask for links.",
    emoji: "👕",
    color: "#D4FF33",
    textColor: "#121212",
    products: ["Graphic tee", "Heavy hoodie", "Cargo pant", "Logo cap"],
  },
  {
    slug: "vintage",
    name: "Vintage Arcade",
    shortName: "Vintage",
    tagline: "Older. Better. One of one.",
    description: "Archive tees, worn-in jackets and pieces with a past. No two rails are ever the same.",
    emoji: "👗",
    color: "#C084FC",
    textColor: "#121212",
    products: ["Band tee", "Vintage jacket", "Slip dress", "Retro denim"],
  },
  {
    slug: "bags",
    name: "Bag Bazaar",
    shortName: "Bags",
    tagline: "Carry the whole look.",
    description: "Totes, shoulder bags and mini bags that finish the fit without trying too hard.",
    emoji: "👜",
    color: "#FFB347",
    textColor: "#121212",
    products: ["Shoulder bag", "Canvas tote", "Crossbody", "Mini bag"],
  },
  {
    slug: "accessories",
    name: "Accessory Alley",
    shortName: "Accessories",
    tagline: "The details do the talking.",
    description: "Belts, sunglasses, caps and scarves. Small pieces, disproportionate impact.",
    emoji: "🕶️",
    color: "#2DD4BF",
    textColor: "#121212",
    products: ["Sunglasses", "Leather belt", "Cap", "Silk scarf"],
  },
  {
    slug: "denim",
    name: "Denim Depot",
    shortName: "Denim",
    tagline: "Good jeans change everything.",
    description: "Vintage Levi's, baggy fits, denim jackets and every wash in between.",
    emoji: "👖",
    color: "#33CCFF",
    textColor: "#121212",
    products: ["Baggy jean", "Denim jacket", "Denim short", "Denim skirt"],
  },
  {
    slug: "jewelry",
    name: "Jewelry Vault",
    shortName: "Jewelry",
    tagline: "Small shine. Big signal.",
    description: "Chains, rings, watches and earrings sourced for the everyday stack.",
    emoji: "💍",
    color: "#FDE047",
    textColor: "#121212",
    products: ["Chain", "Signet ring", "Vintage watch", "Earrings"],
  },
  {
    slug: "outerwear",
    name: "Outerwear Hall",
    shortName: "Outerwear",
    tagline: "The final layer. The first impression.",
    description: "Bombers, leathers, puffers and trenches built for the in-between weather.",
    emoji: "🧥",
    color: "#FB7185",
    textColor: "#121212",
    products: ["Bomber", "Leather jacket", "Puffer", "Trench"],
  },
];

export const ZONE_BY_SLUG = Object.fromEntries(MALL_ZONES.map((zone) => [zone.slug, zone])) as Record<
  ZoneSlug,
  MallZone
>;

export function isZoneSlug(value: string): value is ZoneSlug {
  return value in ZONE_BY_SLUG;
}
