"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminWhatsAppUrl, SELLER_PLANS, type SellerPlanId } from "@/lib/platform";

const SUBSCRIPTION_DAYS = 30;

async function requireApprovedSeller() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  if (session.user.role !== "SELLER" || session.user.sellerStatus !== "APPROVED") {
    redirect("/account");
  }
  return session.user;
}

export async function requestSubscription(formData: FormData) {
  const user = await requireApprovedSeller();
  const planId = formData.get("plan")?.toString();
  const paidVia = formData.get("paidVia")?.toString() ?? "UPI";

  if (!planId || !(planId in SELLER_PLANS)) redirect("/seller/plan?error=plan");
  const plan = SELLER_PLANS[planId as SellerPlanId];
  if (plan.amount <= 0) redirect("/seller/plan?error=free");

  const pending = await prisma.subscription.count({
    where: { sellerId: user.id, status: "PENDING" },
  });
  if (pending > 0) redirect("/seller/plan?error=pending");

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    select: { plan: true, planExpiresAt: true },
  });
  if (
    profile?.planExpiresAt &&
    profile.planExpiresAt > new Date() &&
    profile.plan !== "FREE" &&
    profile.plan !== undefined
  ) {
    const current = SELLER_PLANS[profile.plan as SellerPlanId] ?? SELLER_PLANS.FREE;
    if (current.amount >= plan.amount) redirect("/seller/plan?error=existing");
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.subscription.create({
    data: {
      sellerId: user.id,
      plan: planId as SellerPlanId,
      amount: plan.amount,
      status: "PENDING",
      startsAt,
      endsAt,
    },
  });

  const message = [
    "Hi HypeThrift, I want to subscribe to a seller plan.",
    `Plan: ${plan.label} (${plan.listingLimit} Buy Now listings)`,
    `Amount: ₹${plan.amount}`,
    `Seller: ${user.name ?? "Seller"}`,
    `User ID: ${user.id}`,
    `Paid via: ${paidVia}`,
    "Screenshot attached.",
  ].join("\n");

  redirect(adminWhatsAppUrl(message));
}

export async function approveSubscription(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const subscriptionId = formData.get("subscriptionId")?.toString();
  if (!subscriptionId) return;

  await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findFirst({
      where: { id: subscriptionId, status: "PENDING" },
    });
    if (!sub) return;

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

    await tx.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE", startsAt, endsAt },
    });

    // A seller can only hold one active subscription at a time.
    await tx.subscription.updateMany({
      where: { sellerId: sub.sellerId, status: "ACTIVE", id: { not: sub.id } },
      data: { status: "EXPIRED" },
    });

    await tx.sellerProfile.update({
      where: { userId: sub.sellerId },
      data: { plan: sub.plan, planExpiresAt: endsAt, listingsUsed: 0 },
    });
  });

  revalidatePath("/admin/subscriptions");
  revalidatePath("/seller/plan");
  revalidatePath("/seller/listings/new");
}

export async function rejectSubscription(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const subscriptionId = formData.get("subscriptionId")?.toString();
  if (!subscriptionId) return;

  await prisma.subscription.updateMany({
    where: { id: subscriptionId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/admin/subscriptions");
  revalidatePath("/seller/plan");
}