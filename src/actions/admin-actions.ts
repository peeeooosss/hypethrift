"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

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

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", verified: true },
  });
  revalidatePath("/admin/listings");
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

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { featured: true } });
  if (!listing) return;

  await prisma.listing.update({ where: { id: listingId }, data: { featured: !listing.featured } });
  revalidatePath("/admin/listings");
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
