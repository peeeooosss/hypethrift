export const LISTING_CONDITIONS = [
  "NEW",
  "LIKE_NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
] as const;

export type ListingCondition = typeof LISTING_CONDITIONS[number];