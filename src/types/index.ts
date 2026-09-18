export type CategoryId =
  | "all"
  | "sneakers"
  | "streetwear"
  | "vintage"
  | "bags"
  | "accessories"
  | "denim"
  | "jewelry"
  | "outerwear";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  /** Background color used when the pill is active. */
  color: string;
  /** Text color used when the pill is active. */
  textColor: string;
}

export interface Product {
  id: number;
  listingId?: string;
  category: Exclude<CategoryId, "all">;
  name: string;
  emoji: string;
  bg: string;
  image?: string | null;
  listingMode?: "AUCTION" | "RETAIL" | "BOTH";
  bid: number;
  buyNowPrice?: number | null;
  time: number;
  bids: number;
  viewers: number;
  verified: boolean;
  hot: boolean;
  featured: boolean;
}

export interface UIState {
  selectedCategory: CategoryId;
  searchQuery: string;
  featuredProductId: number;
}
