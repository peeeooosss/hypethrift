export const ADMIN_WHATSAPP = "919864854481";
export const ADMIN_UPI_ID = "9864854481@ptsbi";
export const CONTACT_FEE = 69;

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
