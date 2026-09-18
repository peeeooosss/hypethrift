"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminWhatsAppUrl, formatAddress, RETAIL_CONNECTION_FEE, RETAIL_COMMISSION_RATE } from "@/lib/platform";
import { whatsappUrl } from "@/lib/platform";
import { requireUser } from "@/actions/auction-actions";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------
async function requireSeller() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/account");
  if (session.user.role === "SELLER" && session.user.sellerStatus !== "APPROVED") redirect("/seller/verification");
  return session.user;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
const checkoutSchema = z.object({
  fullName: z.string().min(2, "Enter the receiver's name").max(60),
  phone: z.string().regex(/^[0-9+() -]{7,20}$/, "Enter a valid phone number"),
  addressId: z.string().optional(),
  label: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  paidVia: z.string().min(1, "Select a payment app"),
});

export async function createRetailCheckout(listingId: string, _formData?: FormData) {
  const userId = await requireUser();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      status: true,
      listingMode: true,
      buyNowPrice: true,
      sellerId: true,
      images: true,
      size: true,
      seller: { select: { sellerProfile: { select: { storeName: true } } } },
    },
  });
  if (!listing) return { error: "Listing not found" };
  if (listing.status !== "ACTIVE") return { error: "This item is not available to buy" };
  if (listing.sellerId === userId) return { error: "You cannot buy your own item" };
  if (!["RETAIL", "BOTH"].includes(listing.listingMode)) return { error: "This item is not available for Buy Now" };
  if (listing.buyNowPrice == null) return { error: "This item has no buy-now price" };

  const existing = await prisma.retailOrder.findUnique({ where: { listingId } });
  if (existing && existing.status !== "CANCELLED") return { error: "This item is already being purchased" };

  redirect(`/checkout/retail/${encodeURIComponent(listing.id)}`);
}

async function resolveShippingAddress(userId: string, input: z.infer<typeof checkoutSchema>) {
  const { addressId, label, line1, line2, city, state, pincode, country } = input;
  if (addressId) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (address) {
      return {
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      };
    }
  }
  if (!line1 || !city || !state || !pincode) return null;
  return {
    label: label || "Checkout",
    line1,
    line2: line2 || null,
    city,
    state,
    pincode,
    country: country || "India",
  };
}

export async function submitRetailPayment(formData: FormData) {
  const userId = await requireUser();
  const listingId = formData.get("listingId")?.toString();
  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    addressId: formData.get("addressId")?.toString() || undefined,
    label: formData.get("label")?.toString(),
    line1: formData.get("line1")?.toString(),
    line2: formData.get("line2")?.toString(),
    city: formData.get("city")?.toString(),
    state: formData.get("state")?.toString(),
    pincode: formData.get("pincode")?.toString(),
    country: formData.get("country")?.toString() || "India",
    paidVia: formData.get("paidVia")?.toString(),
  });
  if (!listingId || !parsed.success) {
    redirect(`/checkout/retail/${encodeURIComponent(listingId ?? "")}?error=details`);
  }
  const proofUrl = formData.get("proofUrl")?.toString() ?? "";

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: { select: { sellerProfile: { select: { storeName: true } } } } },
  });
  if (!listing || listing.status !== "ACTIVE") redirect("/listings?error=item_unavailable");
  if (listing.sellerId === userId) redirect("/listings?error=self_purchase");
  if (!["RETAIL", "BOTH"].includes(listing.listingMode) || listing.buyNowPrice == null) {
    redirect(`/listing/${encodeURIComponent(listing.id)}?error=not_buy_now`);
  }

  const shippingAddress = await resolveShippingAddress(userId, parsed.data);
  if (!shippingAddress) redirect(`/checkout/retail/${encodeURIComponent(listing.id)}?error=address`);

  const existing = await prisma.retailOrder.findUnique({ where: { listingId } });
  if (existing && existing.status !== "CANCELLED") redirect("/account/retail-orders");

  const order = await prisma.retailOrder.create({
    data: {
      listingId,
      buyerId: userId,
      sellerId: listing.sellerId,
      finalPrice: listing.buyNowPrice,
      connectionFee: RETAIL_CONNECTION_FEE,
      status: "PENDING_PAYMENT",
      address: shippingAddress,
      buyerPhone: parsed.data.phone,
      buyerName: parsed.data.fullName,
      paymentMethod: parsed.data.paidVia,
      paymentProofUrl: proofUrl || null,
      paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
  await prisma.listing.update({ where: { id: listing.id }, data: { status: "SOLD" } });

  const message = [
    "Hi HypeThrift, I have placed a Buy Now order and paid.",
    `Order ID: ${order.id}`,
    `Item: ${listing.title}`,
    `Amount paid: ₹${(listing.buyNowPrice + RETAIL_CONNECTION_FEE).toLocaleString("en-IN")} (item ${listing.buyNowPrice} + fee ${RETAIL_CONNECTION_FEE})`,
    `Paid via: ${parsed.data.paidVia}`,
    `Receiver: ${parsed.data.fullName} · ${parsed.data.phone}`,
    "Screenshot attached.",
  ].join("\n");

  revalidatePath("/account/retail-orders");
  revalidatePath(`/account/retail-orders/${order.id}`);
  redirect(adminWhatsAppUrl(message));
}

export async function verifyRetailPayment(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  await prisma.retailOrder.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: {
      status: "PAYMENT_VERIFIED",
      adminVerifiedAt: new Date(),
    },
  });
  revalidatePath("/admin/retail-orders");
  revalidatePath("/seller/retail-orders");
  revalidatePath("/account/retail-orders");
  revalidatePath(`/account/retail-orders/${orderId}`);
  redirect("/admin/retail-orders?saved=verified");
}

export async function rejectRetailPayment(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString();
  if (!orderId) return;

  await prisma.retailOrder.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: { status: "PENDING_PAYMENT", adminNotes: note || "Payment proof could not be verified. Please resubmit." },
  });
  revalidatePath("/admin/retail-orders");
  redirect("/admin/retail-orders?saved=rejected");
}

export async function cancelRetailOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString();
  if (!orderId) return;

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: { status: true, listingId: true, buyerId: true },
  });
  if (!order || ["COMPLETED", "CANCELLED"].includes(order.status)) return;

  await prisma.$transaction([
    prisma.retailOrder.update({
      where: { id: orderId },
      data: { status: "CANCELLED", adminNotes: note || "Cancelled by support", completedAt: new Date() },
    }),
    prisma.listing.update({ where: { id: order.listingId }, data: { status: "ACTIVE" } }),
  ]);
  revalidatePath("/admin/retail-orders");
  revalidatePath("/seller/retail-orders");
  revalidatePath("/account/retail-orders");
}

// ---------------------------------------------------------------------------
// Seller fulfillment
// ---------------------------------------------------------------------------
async function sellerRetailOrder(orderId: string) {
  const user = await requireSeller();
  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: { sellerId: true, status: true },
  });
  if (!order || order.sellerId !== user.id) return null;
  return { order, user };
}

export async function packRetailOrder(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerRetailOrder(orderId);
  if (!result || !["PAYMENT_VERIFIED", "PACKED"].includes(result.order.status)) {
    redirect("/seller/retail-orders?error=not_ready");
  }
  await prisma.retailOrder.update({ where: { id: orderId }, data: { status: "PACKED" } });
  revalidatePath("/seller/retail-orders");
  revalidatePath("/account/retail-orders");
  revalidatePath(`/account/retail-orders/${orderId}`);
  redirect("/seller/retail-orders?saved=packed");
}

export async function shipRetailOrder(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerRetailOrder(orderId);
  if (!result || !["PACKED", "PAYMENT_VERIFIED"].includes(result.order.status)) {
    redirect("/seller/retail-orders?error=not_ready");
  }
  const trackingNumber = formData.get("trackingNumber")?.toString();
  const trackingUrl = formData.get("trackingUrl")?.toString();
  if (!trackingNumber) redirect("/seller/retail-orders?error=missing_tracking");

  const fresh = await prisma.retailOrder.update({
    where: { id: orderId },
    data: { status: "SHIPPED", trackingNumber, trackingUrl: trackingUrl || null, shippedAt: new Date() },
    select: { id: true, buyerPhone: true, buyerName: true, listing: { select: { title: true } } },
  });
  revalidatePath("/seller/retail-orders");
  revalidatePath("/account/retail-orders");
  revalidatePath(`/account/retail-orders/${orderId}`);

  if (fresh.buyerPhone) {
    const message = [
      `Hi ${fresh.buyerName ?? "there"}, your HypeThrift Buy Now order for "${fresh.listing.title}" has been shipped!`,
      `Tracking: ${trackingNumber}`,
      "Watch for it, and confirm delivery on HypeThrift once it arrives.",
    ].join("\n");
    redirect(whatsappUrl(fresh.buyerPhone, message));
  }
  redirect("/seller/retail-orders?saved=shipped");
}

export async function markRetailDelivered(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerRetailOrder(orderId);
  if (!result || !["SHIPPED"].includes(result.order.status)) {
    redirect("/seller/retail-orders?error=not_ready");
  }
  const fresh = await prisma.retailOrder.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveredAt: new Date() },
    select: { id: true, buyerPhone: true, buyerName: true, listing: { select: { title: true } } },
  });
  revalidatePath("/seller/retail-orders");
  revalidatePath("/account/retail-orders");
  revalidatePath(`/account/retail-orders/${orderId}`);

  if (fresh.buyerPhone) {
    const message = [
      `Hi ${fresh.buyerName ?? "there"}, your HypeThrift Buy Now order for "${fresh.listing.title}" has been delivered!`,
      "Once you have it in hand, open HypeThrift → Buy Now Orders → I Received It to confirm and complete the order.",
    ].join("\n");
    redirect(whatsappUrl(fresh.buyerPhone, message));
  }
  redirect("/seller/retail-orders?saved=delivered");
}

export async function confirmRetailReceived(formData: FormData) {
  const userId = await requireUser();
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) redirect("/account/retail-orders?error=missing_order");

  const order = await prisma.retailOrder.findUnique({ where: { id: orderId, buyerId: userId } });
  if (!order || order.status !== "DELIVERED") redirect(`/account/retail-orders/${orderId}?error=not_ready`);

  const commission = Math.round(order.finalPrice * RETAIL_COMMISSION_RATE);
  const sellerPayout = order.finalPrice - commission;

  await prisma.retailOrder.update({
    where: { id: order.id },
    data: {
      status: "COMPLETED",
      buyerConfirmedAt: new Date(),
      completedAt: new Date(),
      commission,
      sellerPayout,
    },
  });
  revalidatePath("/account/retail-orders");
  revalidatePath(`/account/retail-orders/${order.id}`);
  revalidatePath("/seller/retail-orders");
  revalidatePath("/admin/retail-orders");
  redirect(`/account/retail-orders/${order.id}?saved=completed`);
}

export async function expireUnpaidRetailOrders() {
  const expired = await prisma.retailOrder.findMany({
    where: { status: "PENDING_PAYMENT", paymentDeadline: { lte: new Date() } },
    select: { id: true, listingId: true },
  });

  for (const order of expired) {
    await prisma.$transaction([
      prisma.retailOrder.update({ where: { id: order.id }, data: { status: "CANCELLED", adminNotes: "Payment not completed in time" } }),
      prisma.listing.update({ where: { id: order.listingId }, data: { status: "ACTIVE" } }),
    ]);
    revalidatePath("/account/retail-orders");
    revalidatePath("/admin/retail-orders");
    revalidatePath(`/listing/${encodeURIComponent(order.listingId)}`);
  }

  return { retailOrdersCancelled: expired.length };
}