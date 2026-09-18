export const ADMIN_WHATSAPP = "919864854481";
export const ADMIN_UPI_ID = "9864854481@ptsbi";
export const CONTACT_FEE = 69;
export const RETAIL_CONNECTION_FEE = 39;
export const RETAIL_COMMISSION_RATE = 0.08;
export const ITEM_PAYMENT_WINDOW_HOURS = 48;
export const FREE_LISTINGS = 2;

export const DURATION_OPTIONS = [1, 4, 12, 24, 48, 72, 168, 336, 720] as const;

export const SELLER_PLANS = {
  FREE: { label: "Free Trial", listingLimit: 3, amount: 0 },
  BASIC_499: { label: "Basic", listingLimit: 15, amount: 499 },
  PRO_999: { label: "Pro", listingLimit: 40, amount: 999 },
} as const;

export type SellerPlanId = keyof typeof SELLER_PLANS;

export const LISTING_PACKAGES = [
  { id: "one", label: "1 listing", credits: 1, amount: 99 },
  { id: "three", label: "3 listings", credits: 3, amount: 249 },
  { id: "eight", label: "8 listings", credits: 8, amount: 499 },
] as const;

export type ListingPackage = (typeof LISTING_PACKAGES)[number];

function query(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

export function upiLinks(amount: number, note: string) {
  const params = query({
    pa: ADMIN_UPI_ID,
    pn: "HypeThrift",
    am: amount.toString(),
    cu: "INR",
    tn: note,
  });

  return {
    generic: `upi://pay?${params}`,
    paytm: `paytmmp://upi/pay?${params}`,
    phonepe: `phonepe://pay?${params}`,
    googlePay: `tez://upi/pay?${params}`,
  };
}

export function whatsappUrl(number: string, message: string) {
  const normalized = number.replace(/\D/g, "");
  const withCountryCode = normalized.length === 10 ? `91${normalized}` : normalized;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

export function adminWhatsAppUrl(message: string) {
  return whatsappUrl(ADMIN_WHATSAPP, message);
}

export function formatAddress(address: unknown) {
  if (!address || typeof address !== "object") return "Not provided";
  const value = address as Record<string, unknown>;
  return [
    value.line1,
    value.line2,
    value.city,
    value.state,
    value.pincode,
    value.country,
  ]
    .filter(Boolean)
    .join(", ");
}
