"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  return session.user.id;
}

export async function createOrderFromListing(listingId: string, _formData?: FormData) {
  const userId = await requireUser();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      bids: { orderBy: { amount: "desc" }, take: 1 },
    },
  });

  if (!listing) return { error: "Listing not found" };
  if (new Date(listing.endsAt) > new Date() || !["ACTIVE", "SOLD", "ENDED"].includes(listing.status)) {
    return { error: "Auction is not ended" };
  }

  const winningBid = listing.bids[0];
  if (!winningBid || winningBid.bidderId !== userId) return { error: "You are not the winning bidder" };
  if (listing.reservePrice && (listing.currentBid ?? 0) < listing.reservePrice) {
    return { error: "Reserve price not met" };
  }

  const existingOrder = await prisma.order.findUnique({
    where: { listingId: listing.id },
    select: { id: true },
  });

  if (existingOrder) {
    redirect(`/checkout/${existingOrder.id}`);
    return;
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        listingId: listing.id,
        buyerId: userId,
        sellerId: listing.sellerId,
        finalPrice: winningBid.amount,
        status: "PENDING_PAYMENT",
      },
    });
    await tx.listing.update({
      where: { id: listing.id },
      data: { status: "SOLD" },
    });
    return newOrder;
  });

  revalidatePath(`/listing/${listingId}`);
  redirect(`/checkout/${order.id}`);
}

export async function processEndedAuctions() {
  const now = new Date();

  const endedListings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      endsAt: { lte: now },
    },
    include: {
      bids: {
        orderBy: { amount: "desc" },
        take: 1,
        include: { bidder: true },
      },
    },
  });

  let auctionsEnded = 0;
  let ordersCreated = 0;

  for (const listing of endedListings) {
    const winningBid = listing.bids[0];
    const meetsReserve = !listing.reservePrice || (listing.currentBid ?? 0) >= listing.reservePrice;

    if (winningBid && meetsReserve) {
      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            listingId: listing.id,
            buyerId: winningBid.bidderId,
            sellerId: listing.sellerId,
            finalPrice: winningBid.amount,
            status: "PENDING_PAYMENT",
          },
        });
        await tx.listing.update({
          where: { id: listing.id },
          data: { status: "SOLD" },
        });
      });
      ordersCreated++;
    } else {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: "ENDED" },
      });
    }
    auctionsEnded++;
    revalidatePath(`/listing/${listing.id}`);
    revalidatePath("/listings");
  }

  return { auctionsEnded, ordersCreated };
}

export async function payForOrder(formData: FormData) {
  const userId = await requireUser();
  const orderId = formData.get("orderId")?.toString();
  const addressId = formData.get("addressId")?.toString();

  if (!orderId) return { error: "Missing order id" };

  const order = await prisma.order.findUnique({
    where: { id: orderId, buyerId: userId },
    include: { listing: true },
  });

  if (!order) return { error: "Order not found" };
  if (order.status !== "PENDING_PAYMENT") return { error: "Order is not available for payment" };

  let shippingAddress: string | null = null;
  if (addressId) {
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (addr) {
      shippingAddress = JSON.stringify({
        label: addr.label,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        country: addr.country,
      });
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paymentId: `pay_manual_${Date.now()}`,
      shippingAddress: shippingAddress ? JSON.parse(shippingAddress) : undefined,
    },
  });

  revalidatePath(`/checkout/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/listing/${order.listingId}`);
  return { success: true };
}

export async function markOrderShipped(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return { error: "Missing order id" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { sellerId: true, listingId: true },
  });

  if (!order || order.sellerId !== session.user.id) return { error: "Unauthorized" };

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED" },
  });

  revalidatePath("/seller/orders");
  return { success: true };
}

export async function markOrderDelivered(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return { error: "Missing order id" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { sellerId: true, listingId: true },
  });

  if (!order || order.sellerId !== session.user.id) return { error: "Unauthorized" };

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED" },
  });

  revalidatePath("/seller/orders");
  return { success: true };
}
