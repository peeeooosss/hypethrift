export type WhatsAppAudience = "buyer" | "seller";
export type WhatsAppCategory = "order" | "payment" | "instagram" | "general";

export type WhatsAppContext = {
  orderId?: string;
  itemTitle?: string;
  buyerName?: string;
  sellerName?: string;
  storeName?: string;
  finalPrice?: number;
  fee?: number;
  deadline?: string;
  buyerPhone?: string;
  sellerWhatsApp?: string;
  listingUrl?: string;
  rejectionReason?: string;
};

export type WhatsAppTemplate = {
  id: string;
  audience: WhatsAppAudience;
  category: WhatsAppCategory;
  label: string;
  build: (context: WhatsAppContext) => string;
};

export type WhatsAppMessage = Pick<WhatsAppTemplate, "id" | "category" | "label"> & { text: string };

export const CATEGORY_LABELS: Record<WhatsAppCategory, string> = {
  order: "Order",
  payment: "Payment",
  instagram: "Instagram",
  general: "General",
};

const value = (input: string | number | undefined, fallback = "not provided") => input ?? fallback;
const money = (input: number | undefined) => `₹${(input ?? 0).toLocaleString("en-IN")}`;

export const BUYER_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "buyer-pay-fee",
    audience: "buyer",
    category: "payment",
    label: "Ask buyer to pay contact fee",
    build: (c) => [
      `Hi ${value(c.buyerName, "there")},`,
      `Your HypeThrift order ${value(c.orderId)} for "${value(c.itemTitle)}" is waiting for the ₹${c.fee ?? 69} contact fee.`,
      "Please open My Orders, click Pay Contact Fee, upload your UPI screenshot, and submit your details.",
      `Please complete it before ${value(c.deadline, "the deadline")} so the order is not cancelled.`,
    ].join("\n"),
  },
  {
    id: "buyer-submit-proof",
    audience: "buyer",
    category: "order",
    label: "Ask buyer to submit proof",
    build: (c) => [
      `Hi ${value(c.buyerName, "there")}, we are waiting for the payment screenshot and buyer details for order ${value(c.orderId)} (${value(c.itemTitle)}).`,
      `Please click Pay Contact Fee in My Orders, upload a clear screenshot for ₹${c.fee ?? 69}, accept the buyer agreement, and submit it.`,
    ].join("\n"),
  },
  {
    id: "buyer-fee-verified",
    audience: "buyer",
    category: "order",
    label: "Tell buyer fee is verified",
    build: (c) => [
      `Hi ${value(c.buyerName, "there")}, your ₹${c.fee ?? 69} contact fee for order ${value(c.orderId)} is verified.`,
      `Seller: ${value(c.storeName)}. You can now contact the seller and pay ${money(c.finalPrice)} directly for "${value(c.itemTitle)}".`,
      `Please complete the item payment before ${value(c.deadline, "the 48-hour deadline")} and confirm receipt after delivery.`,
    ].join("\n"),
  },
  {
    id: "buyer-fee-rejected",
    audience: "buyer",
    category: "order",
    label: "Ask buyer to resubmit rejected proof",
    build: (c) => [
      `Hi ${value(c.buyerName, "there")}, your contact-fee proof for order ${value(c.orderId)} (${value(c.itemTitle)}) could not be verified.`,
      "Please open My Orders, upload a clear UPI screenshot showing the amount and transaction, and submit it again.",
    ].join("\n"),
  },
  {
    id: "buyer-pay-seller-reminder",
    audience: "buyer",
    category: "payment",
    label: "Remind buyer to pay seller",
    build: (c) => [
      `Hi ${value(c.buyerName, "there")}, reminder for order ${value(c.orderId)}: please pay ${money(c.finalPrice)} directly to ${value(c.storeName)} for "${value(c.itemTitle)}".`,
      `The payment window ends ${value(c.deadline, "soon")}. Please contact the seller from your order page after payment.`,
    ].join("\n"),
  },
  {
    id: "buyer-confirm-receipt",
    audience: "buyer",
    category: "order",
    label: "Ask buyer to confirm receipt",
    build: (c) => [
      `Hi ${value(c.buyerName, "there")}, the seller has marked order ${value(c.orderId)} (${value(c.itemTitle)}) as handed over.`,
      "After checking the item, please open My Orders and click I received the item - complete order.",
    ].join("\n"),
  },
  {
    id: "buyer-instagram",
    audience: "buyer",
    category: "instagram",
    label: "Request buyer Instagram post",
    build: (c) => [
      `Congratulations on your HypeThrift purchase of "${value(c.itemTitle)}"!`,
      "When it arrives, share a photo or styling video and tag @hypethrift so we can feature you.",
    ].join("\n"),
  },
  {
    id: "buyer-missed-deadline",
    audience: "buyer",
    category: "general",
    label: "Explain missed payment deadline",
    build: (c) => [
      `Order ${value(c.orderId)} for "${value(c.itemTitle)}" was cancelled because the contact fee was not completed before the deadline.`,
      "Please contact HypeThrift if you believe this was an error.",
    ].join("\n"),
  },
];

export const SELLER_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "seller-welcome",
    audience: "seller",
    category: "general",
    label: "Welcome approved seller",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, your HypeThrift seller account for ${value(c.storeName, "your store")} is approved!`,
      "Your 2 free listing credits have been added. Create your first listing and share it with your audience.",
    ].join("\n"),
  },
  {
    id: "seller-rejected",
    audience: "seller",
    category: "general",
    label: "Explain seller rejection",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, your HypeThrift seller application needs an update.`,
      `Reason: ${value(c.rejectionReason, "please review your application details")}`,
      "Please correct the details and re-apply from your seller verification page.",
    ].join("\n"),
  },
  {
    id: "seller-fee-verified",
    audience: "seller",
    category: "order",
    label: "Tell seller buyer fee is verified",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, the buyer's ₹${c.fee ?? 69} contact fee for order ${value(c.orderId)} is verified.`,
      `Item: "${value(c.itemTitle)}" | Winning price: ${money(c.finalPrice)}`,
      "Please contact the buyer, confirm the item payment, tick Buyer paid me for the item, save, and click Mark handoff ready in Seller Orders.",
    ].join("\n"),
  },
  {
    id: "seller-confirm-item-payment",
    audience: "seller",
    category: "payment",
    label: "Ask seller to confirm item payment",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, order ${value(c.orderId)} for "${value(c.itemTitle)}" is waiting for your update.`,
      `After receiving ${money(c.finalPrice)} from the buyer, open Seller Orders, tick Buyer paid me for the item, save, and click Mark handoff ready.`,
    ].join("\n"),
  },
  {
    id: "seller-mark-handoff",
    audience: "seller",
    category: "order",
    label: "Ask seller to mark handoff ready",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, the buyer's contact fee for order ${value(c.orderId)} is verified.`,
      "Once the buyer has paid you and the item is shipped or handed over, click Mark handoff ready in Seller Orders so the buyer can complete the order.",
    ].join("\n"),
  },
  {
    id: "seller-unpaid-buyer",
    audience: "seller",
    category: "payment",
    label: "Ask seller to report unpaid order",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, the item-payment window for order ${value(c.orderId)} (${value(c.itemTitle)}) has passed.`,
      "If the buyer did not pay you, open Seller Orders and click Buyer did not pay. If payment was received, update the order and mark handoff ready.",
    ].join("\n"),
  },
  {
    id: "seller-credits",
    audience: "seller",
    category: "payment",
    label: "Explain listing credit purchase",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, you need listing credits to launch more live listings.`,
      "Buy 1 credit for ₹99, 3 for ₹249, or 8 for ₹499 from Seller Credits. Pay by UPI, upload proof, and send it to HypeThrift for verification.",
    ].join("\n"),
  },
  {
    id: "seller-instagram",
    audience: "seller",
    category: "instagram",
    label: "Invite seller Instagram feature",
    build: (c) => [
      `Hi ${value(c.sellerName, "there")}, we would love to feature ${value(c.storeName, "your store")} on @hypethrift.`,
      "Reply with your best item photos, store story, and Instagram handle so we can plan a feature.",
    ].join("\n"),
  },
  {
    id: "seller-sale-instagram",
    audience: "seller",
    category: "instagram",
    label: "Request seller sale post",
    build: (c) => [
      `Your item "${value(c.itemTitle)}" sold for ${money(c.finalPrice)} on HypeThrift!`,
      "Share the sale and tag @hypethrift so we can feature it in our stories.",
    ].join("\n"),
  },
  {
    id: "seller-featured",
    audience: "seller",
    category: "general",
    label: "Offer featured placement",
    build: (c) => [
      `Want more visibility for "${value(c.itemTitle)}"?`,
      "Ask HypeThrift about paid Featured placement for 1, 3, 7, 14, or 30 days so your item appears first to shoppers.",
    ].join("\n"),
  },
];

export function resolveWhatsAppMessages(templates: WhatsAppTemplate[], context: WhatsAppContext): WhatsAppMessage[] {
  return templates.map(({ id, category, label, build }) => ({ id, category, label, text: build(context) }));
}
