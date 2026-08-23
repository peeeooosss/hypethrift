"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminWhatsAppUrl, CONTACT_FEE, formatAddress } from "@/lib/platform";

const orderDetailsSchema = z.object({
  phone: z.string().min(7, "Enter a valid phone number"),
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

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
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

export async function processEndedAuctions() {
  const now = new Date();
  const endedListings = await prisma.listing.findMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
  });
  let auctionsEnded = 0;
  let ordersCreated = 0;

  for (const listing of endedListings) {
    const winningBid = await winnerForListing(listing.id);
    const meetsReserve = !listing.reservePrice || !!winningBid && winningBid.amount >= listing.reservePrice;

    if (winningBid && meetsReserve) {
      const existingOrder = await prisma.order.findUnique({ where: { listingId: listing.id }, select: { id: true } });
      if (!existingOrder) {
        await prisma.order.create({
          data: {
            listingId: listing.id,
            buyerId: winningBid.bidderId,
            sellerId: listing.sellerId,
            finalPrice: winningBid.amount,
            platformFee: CONTACT_FEE,
            paymentDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            status: "PENDING_CONTACT_FEE",
          },
        });
        ordersCreated++;
      }
      await prisma.listing.update({ where: { id: listing.id }, data: { status: "SOLD" } });
    } else {
      await prisma.listing.update({ where: { id: listing.id }, data: { status: "ENDED" } });
    }

    auctionsEnded++;
    revalidatePath(`/listing/${listing.id}`);
    revalidatePath("/listings");
    revalidatePath("/account/bids");
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
  if (!["PENDING_CONTACT_FEE", "REJECTED"].includes(order.status)) redirect(`/account/orders/${order.id}`);

  let shippingAddress: Record<string, string | null> | null = null;
  if (parsed.data.addressId) {
    const address = await prisma.address.findFirst({ where: { id: parsed.data.addressId, userId } });
    if (address) {
      shippingAddress = {
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
  if (!shippingAddress) {
    const required = [parsed.data.line1, parsed.data.city, parsed.data.state, parsed.data.pincode];
    if (required.some((value) => !value)) redirect(`/account/bids/${order.listingId}/contact?error=address`);
    shippingAddress = {
      label: parsed.data.label || "Checkout",
      line1: parsed.data.line1 || null,
      line2: parsed.data.line2 || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      pincode: parsed.data.pincode || null,
      country: parsed.data.country || "India",
    };
  }

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
    data: { status: "CONTACT_FEE_PAID", contactFeeConfirmed: true },
  });
  revalidatePath("/admin/contact-fees");
  revalidatePath("/admin/orders");
  revalidatePath("/account/bids");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function rejectContactFee(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  await prisma.order.updateMany({ where: { id: orderId, status: "WAITING_VERIFICATION" }, data: { status: "REJECTED", contactFeeConfirmed: false } });
  revalidatePath("/admin/contact-fees");
  revalidatePath("/account/bids");
}

async function sellerOrder(orderId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/account");
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { sellerId: true, status: true, sellerOrderDetails: true, buyerId: true } });
  if (!order || order.sellerId !== session.user.id) return null;
  return { order, userId: session.user.id };
}

export async function updateSellerOrderDetails(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerOrder(orderId);
  if (!result) return { error: "Unauthorized" };
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
}

export async function markOrderCompleted(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerOrder(orderId);
  if (!result || result.order.status !== "CONTACT_FEE_PAID") return { error: "Order is not ready to complete" };
  const current = result.order.sellerOrderDetails && typeof result.order.sellerOrderDetails === "object" ? result.order.sellerOrderDetails as Record<string, unknown> : {};
  await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED", sellerOrderDetails: { ...current, completedAt: new Date().toISOString() } } });
  revalidatePath("/seller/orders");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function reportBuyerNoPayment(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;
  const result = await sellerOrder(orderId);
  if (!result) return { error: "Unauthorized" };
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true, paymentDeadline: true, status: true } });
  if (!order || order.status !== "CONTACT_FEE_PAID") return { error: "Order is not ready for this action" };
  if (!order.paymentDeadline || order.paymentDeadline > new Date()) return { error: "The buyer still has time to complete payment" };
  await prisma.$transaction([
    prisma.user.update({ where: { id: order.buyerId }, data: { isBanned: true } }),
    prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
  ]);
  revalidatePath("/seller/orders");
  revalidatePath("/admin/users");
  revalidatePath("/account/bids");
}
