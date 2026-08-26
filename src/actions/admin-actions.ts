"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { ITEM_PAYMENT_WINDOW_HOURS } from "@/lib/platform";

type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN" || session.user.isBanned) {
    redirect("/login");
  }
  return session;
}

async function requireAdminOrThrow() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return { user: session.user };
}

// ---------------------------------------------------------------------------
// Seller moderation
// ---------------------------------------------------------------------------
export async function approveSeller(formData: FormData) {
  await requireAdminOrThrow();
  const userId = formData.get("userId")?.toString();
  if (!userId) return;

  const applicant = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (applicant?.role !== "SELLER") {
    revalidatePath("/admin/sellers");
    return;
  }
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile?.acceptedAgreement || !profile.storeName || !profile.whatsappNumber) {
    revalidatePath("/admin/sellers");
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "SELLER", sellerStatus: "APPROVED", sellerNote: null },
  });
  revalidatePath("/admin/sellers");
  redirect("/admin/sellers");
}

export async function rejectSeller(formData: FormData) {
  await requireAdminOrThrow();
  const userId = formData.get("userId")?.toString();
  const note = formData.get("note")?.toString();
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { sellerStatus: "REJECTED", sellerNote: note ?? null },
  });
  revalidatePath("/admin/sellers");
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------
export async function changeUserRole(formData: FormData) {
  await requireAdminOrThrow();
  const userId = formData.get("userId")?.toString();
  const role = formData.get("role")?.toString();
  if (!userId || !role) return;

  if (role === "SELLER") {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role !== "SELLER") return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as UserRole, sellerStatus: role === "SELLER" ? "APPROVED" : null },
  });
  revalidatePath("/admin/users");
}

export async function banUser(formData: FormData) {
  await requireAdminOrThrow();
  const userId = formData.get("userId")?.toString();
  if (!userId) return;

  await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
  revalidatePath("/admin/users");
}

export async function unbanUser(formData: FormData) {
  await requireAdminOrThrow();
  const userId = formData.get("userId")?.toString();
  if (!userId) return;

  await prisma.user.update({ where: { id: userId }, data: { isBanned: false } });
  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Listing moderation
// ---------------------------------------------------------------------------
export async function approveListing(formData: FormData) {
  await requireAdminOrThrow();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true },
  });
  if (!listing || listing.status !== "PENDING_REVIEW") return;

  const updated = await prisma.$transaction(async (tx) => {
    const seller = await tx.user.updateMany({
      where: { id: listing.sellerId, listingCredits: { gt: 0 } },
      data: { listingCredits: { decrement: 1 } },
    });
    if (seller.count !== 1) return false;

    await tx.listing.update({
      where: { id: listingId },
      data: { status: "ACTIVE", verified: true },
    });
    return true;
  });

  if (!updated) {
    revalidatePath("/admin/listings");
    return;
  }
  revalidatePath("/admin/listings");
  revalidatePath("/seller/listings");
}

export async function rejectListing(formData: FormData) {
  await requireAdminOrThrow();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  await prisma.listing.update({ where: { id: listingId }, data: { status: "REJECTED" } });
  revalidatePath("/admin/listings");
}

export async function toggleFeatured(formData: FormData) {
  await requireAdminOrThrow();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { featured: true, featuredUntil: true } });
  if (!listing) return;

  await prisma.listing.update({
    where: { id: listingId },
    data: listing.featured
      ? { featured: false, featuredUntil: null }
      : { featured: true, featuredUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  revalidatePath("/admin/listings");
  revalidatePath("/admin/featured");
}

const FEATURE_DURATION_DAYS = [1, 3, 7, 14, 30] as const;

export async function featureListing(formData: FormData) {
  await requireAdminOrThrow();
  const listingId = formData.get("listingId")?.toString();
  const days = Number(formData.get("days"));
  const amount = Number(formData.get("amount"));
  const note = formData.get("note")?.toString() || null;
  if (!listingId || !FEATURE_DURATION_DAYS.includes(days as (typeof FEATURE_DURATION_DAYS)[number]) || isNaN(amount) || amount < 0) {
    return { error: "Invalid feature input" };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { status: true, featuredUntil: true },
  });
  if (!listing || listing.status !== "ACTIVE") {
    return { error: "Only active listings can be featured" };
  }

  const base = listing.featuredUntil && listing.featuredUntil > new Date()
    ? listing.featuredUntil.getTime()
    : Date.now();
  const until = new Date(base + days * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: { featured: true, featuredUntil: until },
    }),
    ...(amount > 0
      ? [prisma.featureCharge.create({ data: { listingId, amount, days, note } })]
      : []),
  ]);

  revalidatePath("/admin/featured");
  revalidatePath("/admin/listings");
  revalidatePath("/");
  revalidatePath("/listings");
  return null;
}

export async function unfeatureListing(formData: FormData) {
  await requireAdminOrThrow();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  await prisma.listing.updateMany({
    where: { id: listingId, featured: true },
    data: { featured: false, featuredUntil: null },
  });
  revalidatePath("/admin/featured");
  revalidatePath("/admin/listings");
  revalidatePath("/");
}

export async function deleteListing(formData: FormData) {
  await requireAdminOrThrow();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  await prisma.listing.delete({ where: { id: listingId } });
  revalidatePath("/admin/listings");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const createCategorySchema = z.object({
  name: z.string().min(1),
  emoji: z.string().min(1),
  color: z.string().min(1),
  textColor: z.string().min(1),
});

export async function createCategory(prevState: { error?: string } | null, formData: FormData) {
  try {
    await requireAdminOrThrow();
  } catch {
    return { error: "Unauthorized" };
  }

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji"),
    color: formData.get("color"),
    textColor: formData.get("textColor"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const slug = slugify(parsed.data.name);
  try {
    await prisma.category.create({ data: { ...parsed.data, slug } });
  } catch {
    return { error: "Category may already exist" };
  }
  revalidatePath("/admin/categories");
  return null;
}

export async function deleteCategory(formData: FormData) {
  await requireAdminOrThrow();
  const categoryId = formData.get("categoryId")?.toString();
  if (!categoryId) return;

  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/admin/categories");
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------
export async function updateTicketStatus(formData: FormData) {
  await requireAdminOrThrow();
  const ticketId = formData.get("ticketId")?.toString();
  const status = formData.get("status")?.toString();
  if (!ticketId || !status) return;

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });
  revalidatePath("/admin/support");
}

export async function deleteSupportTicket(formData: FormData) {
  await requireAdminOrThrow();
  const ticketId = formData.get("ticketId")?.toString();
  if (!ticketId) return;

  await prisma.supportTicket.delete({ where: { id: ticketId } });
  revalidatePath("/admin/support");
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
const orderStatusSchema = z.enum(["PENDING_CONTACT_FEE", "WAITING_VERIFICATION", "CONTACT_FEE_PAID", "COMPLETED", "REJECTED", "CANCELLED"]);

type OrderStatus = z.infer<typeof orderStatusSchema>;

const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_CONTACT_FEE: ["WAITING_VERIFICATION", "CANCELLED"],
  WAITING_VERIFICATION: ["CONTACT_FEE_PAID", "REJECTED", "CANCELLED"],
  CONTACT_FEE_PAID: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: ["PENDING_CONTACT_FEE", "CANCELLED"],
  CANCELLED: [],
};

export async function updateOrderStatus(formData: FormData) {
  await requireAdminOrThrow();
  const orderId = formData.get("orderId")?.toString();
  const parsedStatus = orderStatusSchema.safeParse(formData.get("status")?.toString());
  if (!orderId || !parsedStatus.success) return;

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return;

  const allowed = VALID_ORDER_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(parsedStatus.data)) {
    redirect(`/admin/orders?error=invalid_transition&orderId=${orderId}`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: parsedStatus.data,
      ...(parsedStatus.data === "CONTACT_FEE_PAID" ? {
        contactFeeConfirmed: true,
        itemPaymentDeadline: new Date(Date.now() + ITEM_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
      } : {}),
      ...(parsedStatus.data === "COMPLETED" ? {
        buyerConfirmedAt: new Date(),
      } : {}),
    },
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/contact-fees");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/seller/orders");
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------
export async function createPayout(formData: FormData) {
  try {
    await requireAdminOrThrow();
  } catch {
    return { error: "Unauthorized" };
  }

  const sellerId = formData.get("sellerId")?.toString();
  const amount = Number(formData.get("amount"));
  const method = formData.get("method")?.toString() ?? "bank";

  if (!sellerId || isNaN(amount) || amount <= 0) {
    return { error: "Invalid input" };
  }

  await prisma.payout.create({
    data: {
      sellerId,
      amount,
      method,
      status: "COMPLETED",
    },
  });

  revalidatePath("/admin/payouts");
  return null;
}

export async function updatePayoutStatus(formData: FormData) {
  await requireAdminOrThrow();
  const payoutId = formData.get("payoutId")?.toString();
  const status = formData.get("status")?.toString();
  if (!payoutId || !status) return;

  await prisma.payout.update({
    where: { id: payoutId },
    data: { status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" },
  });
  revalidatePath("/admin/payouts");
}
