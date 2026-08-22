export const SIZE_OPTIONS: Record<string, string[]> = {
  sneakers: [
    "UK 6", "UK 6.5", "UK 7", "UK 7.5", "UK 8", "UK 8.5",
    "UK 9", "UK 9.5", "UK 10", "UK 10.5", "UK 11", "UK 11.5",
    "UK 12", "UK 12.5", "UK 13",
  ],
  streetwear: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  vintage: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  denim: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  outerwear: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  bags: ["One Size"],
  accessories: ["One Size"],
  jewelry: ["One Size"],
};

export function getSizesForCategory(categorySlug: string | null | undefined): string[] {
  if (!categorySlug) return [];
  return SIZE_OPTIONS[categorySlug] ?? [];
}

const ONE_SIZE = new Set(["One Size"]);
export function isOneSizeCategory(categorySlug?: string): boolean {
  if (!categorySlug) return false;
  const opts = SIZE_OPTIONS[categorySlug];
  return !!opts && opts.every((o) => ONE_SIZE.has(o));
}

export function sizeIsValidForCategory(size: string | null | undefined, categorySlug?: string): boolean {
  const opts = getSizesForCategory(categorySlug);
  if (opts.length === 0) return true;
  if (!size) return false;
  return opts.includes(size);
}
