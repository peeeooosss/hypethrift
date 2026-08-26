"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminWhatsAppUrl, CONTACT_FEE, formatAddress, ITEM_PAYMENT_WINDOW_HOURS } from "@/lib/platform";

const orderDetailsSchema = z.object({
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
  agreement: z.literal("on"),
});

const buyerDetailsSchema = z.object({
  phone: z.string().regex(/^[0-9+() -]{7,20}$/, "Enter a valid phone number"),
  addressId: z.string().optional(),
  label: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  agreement: z.literal("on"),
});

type AddressInput = {
  addressId?: string;
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

async function resolveShippingAddress(userId: string, input: AddressInput) {
  if (input.addressId) {
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId } });
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

  if (!input.line1 || !input.city || !input.state || !input.pincode) return null;
  return {
    label: input.label || "Checkout",
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    country: input.country || "India",
  };
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect(session.user.role === "ADMIN" ? "/admin" : "/seller");
  return session.user.id;
}

async function winnerForListing(listingId: string) {
  return prisma.bid.findFirst({
    where: { listingId },
    orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
  });
}

export async function createOrderFromListing(listingId: string, _formData?: FormData) {
  const userId = await requireUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found" };
  if (new Date(listing.endsAt) > new Date()) return { error: "Auction is not ended" };

  const winningBid = await winnerForListing(listingId);
  if (!winningBid || winningBid.bidderId !== userId) return { error: "You are not the winning bidder" };
  if (listing.reservePrice && winningBid.amount < listing.reservePrice) return { error: "Reserve price not met" };

  let order = await prisma.order.findUnique({ where: { listingId }, select: { id: true } });
  if (!order) {
    order = await prisma.order.create({
      data: {
        listingId,
        buyerId: userId,
        sellerId: listing.sellerId,
        finalPrice: winningBid.amount,
        platformFee: CONTACT_FEE,
        paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "PENDING_CONTACT_FEE",
      },
      select: { id: true },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { status: "SOLD" } });
  }

  revalidatePath("/account/bids");
  redirect(`/account/bids/${encodeURIComponent(listingId)}/contact`);
}

/**
 * Seller-initiated early close. Stops the auction immediately, then applies
 * the same winner logic as the natural expiry: highest bid (earliest on tie)
 * wins if it meets the reserve; otherwise the listing ends without a sale.
 */
export async function closeAuction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(session.user.role)) redirect("/account");
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true },
  });
  if (!listing || listing.sellerId !== session.user.id) return;

  // Atomic stop: only succeeds if the auction is still live, so no bid can
  // land after this point (placeBid re-checks endsAt inside its transaction).
  await prisma.listing.updateMany({
    where: { id: listingId, status: "ACTIVE", endsAt: { gt: new Date() } },
    data: { endsAt: new Date() },
  });

  const fresh = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { status: true, reservePrice: true, sellerId: true },
  });
  if (!fresh || fresh.status !== "ACTIVE") {
    revalidatePath("/seller/listings");
    return;
  }

  await finalizeListing(listingId, fresh.sellerId, fresh.reservePrice);
}

async function finalizeListing(listingId: string, sellerId: string, reservePrice: number | null) {
  const winningBid = await winnerForListing(listingId);
  const meetsReserve = !reservePrice || (!!winningBid && winningBid.amount >= reservePrice);

  if (winningBid && meetsReserve) {
    const existingOrder = await prisma.order.findUnique({ where: { listingId }, select: { id: true } });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          listingId,
          buyerId: winningBid.bidderId,
          sellerId,
          finalPrice: winningBid.amount,
          platformFee: CONTACT_FEE,
          paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "PENDING_CONTACT_FEE",
        },
      });
    }
    await prisma.listing.update({ where: { id: listingId }, data: { status: "SOLD" } });
  } else {
    await prisma.listing.update({ where: { id: listingId }, data: { status: "ENDED" } });
  }

  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/listings");
  revalidatePath("/");
  revalidatePath("/account/bids");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/listings");
  revalidatePath("/seller/listings");
  revalidatePath("/seller/orders");
}
export async function processEndedAuctions() {
  const now = new Date();
  const endedListings = await prisma.listing.findMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
  });
  let auctionsEnded = 0;
  let ordersCreated = 0;

  for (const listing of endedListings) {
    const ordersBefore = await prisma.order.count();
    await finalizeListing(listing.id, listing.sellerId, listing.reservePrice);
    const ordersAfter = await prisma.order.count();
    if (ordersAfter > ordersBefore) ordersCreated++;
    auctionsEnded++;
  }

  return { auctionsEnded, ordersCreated };
}

export async function expireUnpaidOrders() {
  const expired = await prisma.order.findMany({
    where: {
      status: "PENDING_CONTACT_FEE",
      paymentDeadline: { lte: new Date() },
    },
    select: { id: true, buyerId: true },
  });

  for (const order of expired) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: order.buyerId }, data: { isBanned: true } }),
      prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
    ]);
    revalidatePath("/account/bids");
    revalidatePath("/admin/orders");
  }

  return { ordersCancelled: expired.length, usersBanned: expired.length };
}

export async function submitContactFee(formData: FormData) {
  const userId = await requireUser();
  const orderId = formData.get("orderId")?.toString();
  const parsed = orderDetailsSchema.safeParse({
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
    agreement: formData.get("agreement"),
  });
  if (!orderId || !parsed.success) redirect(`/account/bids/${orderId ?? ""}/contact?error=details`);

  const order = await prisma.order.findUnique({ where: { id: orderId, buyerId: userId }, include: { listing: true } });
  if (!order) redirect("/account/bids?error=order");
  if (order.paymentDeadline && order.paymentDeadline <= new Date()) {
    await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    redirect("/login?error=payment-deadline");
  }
  const canSubmit = ["PENDING_CONTACT_FEE", "REJECTED"].includes(order.status)
    || (order.status === "CONTACT_FEE_PAID" && !order.contactFeeConfirmed);
  if (!canSubmit) redirect(`/account/orders/${order.id}`);

  const shippingAddress = await resolveShippingAddress(userId, parsed.data);
  if (!shippingAddress) redirect(`/account/bids/${order.listingId}/contact?error=address`);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      shippingAddress,
      buyerPhone: parsed.data.phone,
      buyerAgreementAccepted: true,
      paidVia: parsed.data.paidVia,
      status: "WAITING_VERIFICATION",
    },
  });

  const message = [
    "Hi HypeThrift, I have paid the buyer contact fee.",
    `Order ID: ${order.id}`,
    `Buyer: ${userId}`,
    `Item: ${order.listing.title}`,
    `Amount: ₹${order.platformFee}`,
    `Paid via: ${parsed.data.paidVia}`,
    "Screenshot attached.",
  ].join("\n");

  revalidatePath("/account/bids");
  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath("/admin/contact-fees");
  redirect(adminWhatsAppUrl(message));
}

export async function approveContactFee(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  await prisma.order.updateMany({
    where: { id: orderId, status: "WAITING_VERIFICATION" },
    data: {
      status: "CONTACT_FEE_PAID",
      contactFeeConfirmed: true,
      itemPaymentDeadline: new Date(Date.now() + ITEM_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
    },
  });
  revalidatePath("/admin/contact-fees");
  revalidatePath("/admin/orders");
  revalidatePath("/account/bids");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/seller/orders");
}

export async function rejectContactFee(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  await prisma.order.updateMany({ where: { id: orderId, status: "WAITING_VERIFICATION" }, data: { status: "REJECTED", contactFeeConfirmed: false } });
  revalidatePath("/admin/contact-fees");
  revalidatePath("/account/bids");
  revalidatePath("/seller/orders");
}

export async function updateBuyerOrderDetails(formData: FormData) {
  const userId = await requireUser();
  const orderId = formData.get("orderId")?.toString();
  const parsed = buyerDetailsSchema.safeParse({
    phone: formData.get("phone"),
    addressId: formData.get("addressId")?.toString() || undefined,
    label: formData.get("label")?.toString(),
    line1: formData.get("line1")?.toString(),
    line2: formData.get("line2")?.toString(),
    city: formData.get("city")?.toString(),
    state: formData.get("state")?.toString(),
    pincode: formData.get("pincode")?.toString(),
    country: formData.get("country")?.toString() || "India",
    agreement: formData.get("agreement"),
  });
  if (!orderId || !parsed.success) redirect(`/account/orders/${orderId ?? ""}?error=details`);

  const order = await prisma.order.findUnique({ where: { id: orderId, buyerId: userId } });
  if (!order || !["WAITING_VERIFICATION", "CONTACT_FEE_PAID", "COMPLETED"].includes(order.status)) {
    redirect(`/account/orders/${orderId ?? ""}?error=order`);
  }

  const shippingAddress = await resolveShippingAddress(userId, parsed.data);
  if (!shippingAddress) redirect(`/account/orders/${order.id}?error=address`);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      buyerPhone: parsed.data.phone,
      shippingAddress,
      buyerAgreementAccepted: true,
    },
  });
  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath("/account/orders");
  revalidatePath("/account/bids");
  revalidatePath("/seller/orders");
  redirect(`/account/orders/${order.id}`);
}

export async function confirmOrderReceived(formData: FormData) {
  const userId = await requireUser();
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return { error: "Missing order" };

  const order = await prisma.order.findUnique({ where: { id: orderId, buyerId: userId } });
  if (!order || order.status !== "CONTACT_FEE_PAID") return { error: "Order is not ready to complete" };
  if (!order.sellerMarkedReadyAt) return { error: "The seller must mark the order ready first" };

  await prisma.order.update({
    where: { id: order.id },
    data: { buyerConfirmedAt: new Date(), status: "COMPLETED" },
  });
  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath("/account/orders");
  revalidatePath("/account/bids");
}

async function sellerOrder(orderId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/account");
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { sellerId: true, status: true, sellerOrderDetails: true, buyerId: true, buyerConfirmedAt: true } });
  if (!order || order.sellerId !== session.user.id) return null;
  return { order, userId: session.user.id };
}

export async function updateSellerOrderDetails(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerOrder(orderId);
  if (!result) return { error: "Unauthorized" };
  if (!(["CONTACT_FEE_PAID", "COMPLETED"] as string[]).includes(result.order.status)) return { error: "Buyer contact fee is not verified" };
  const current = result.order.sellerOrderDetails && typeof result.order.sellerOrderDetails === "object" ? result.order.sellerOrderDetails as Record<string, unknown> : {};
  await prisma.order.update({
    where: { id: orderId },
    data: {
      sellerOrderDetails: {
        ...current,
        trackingNumber: formData.get("trackingNumber")?.toString() || null,
        courier: formData.get("courier")?.toString() || null,
        notes: formData.get("notes")?.toString() || null,
        sellerPaymentReceived: formData.get("sellerPaymentReceived") === "on",
      },
    },
  });
  revalidatePath("/seller/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function markOrderCompleted(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerOrder(orderId);
  if (!result || result.order.status !== "CONTACT_FEE_PAID") return { error: "Order is not ready to complete" };
  const current = result.order.sellerOrderDetails && typeof result.order.sellerOrderDetails === "object" ? result.order.sellerOrderDetails as Record<string, unknown> : {};
  if (current.sellerPaymentReceived !== true) return { error: "Confirm that the buyer paid for the item first" };
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: result.order.buyerConfirmedAt ? "COMPLETED" : "CONTACT_FEE_PAID",
      sellerMarkedReadyAt: new Date(),
      sellerOrderDetails: { ...current, sellerMarkedReadyAt: new Date().toISOString() },
    },
  });
  revalidatePath("/seller/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function reportBuyerNoPayment(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerOrder(orderId);
  if (!result) return { error: "Unauthorized" };
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true, itemPaymentDeadline: true, status: true } });
  if (!order || order.status !== "CONTACT_FEE_PAID") return { error: "Order is not ready for this action" };
  if (!order.itemPaymentDeadline || order.itemPaymentDeadline > new Date()) return { error: "The buyer still has time to complete payment" };
  await prisma.$transaction([
    prisma.user.update({ where: { id: order.buyerId }, data: { isBanned: true } }),
    prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
  ]);
  revalidatePath("/seller/orders");
  revalidatePath("/admin/users");
  revalidatePath("/account/bids");
}
