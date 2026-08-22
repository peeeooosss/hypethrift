"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type ListingConditionType = "NEW" | "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR";

async function requireSeller() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SELLER", "ADMIN"].includes(session.user.role)) redirect("/account");
  if (session.user.isBanned) redirect("/login");
  if (session.user.role === "SELLER" && session.user.sellerStatus !== "APPROVED") redirect("/seller/verification");
  return { id: session.user.id, role: session.user.role };
}

const DURATION_OPTIONS = [1, 4, 12, 24, 48] as const;

const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description is too short"),
  categoryId: z.string().min(1, "Select a category"),
  startingBid: z.coerce.number().int().min(1, "Starting bid is required"),
  reservePrice: z.coerce.number().int().optional().or(z.literal("").transform(() => undefined)),
  size: z.string().optional(),
  condition: z.enum(["NEW", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"]).optional(),
  duration: z.enum(["1", "4", "12", "24", "48"]).transform(Number),
  images: z.array(z.string().url()).min(1, "Upload at least one image"),
  action: z.enum(["save_draft", "submit_review"]),
});

export async function createListing(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const seller = await requireSeller();
  if (!seller) return { error: "Unauthorized" };

  // images submitted as a comma-separated hidden field
  const rawImages = formData.get("images")?.toString() ?? "";
  const images = rawImages ? rawImages.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    startingBid: formData.get("startingBid"),
    reservePrice: formData.get("reservePrice"),
    size: formData.get("size"),
    condition: formData.get("condition"),
    duration: formData.get("duration"),
    images,
    action: formData.get("action"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    title,
    description,
    categoryId,
    startingBid,
    reservePrice,
    size,
    condition,
    duration,
    images: imgs,
    action,
  } = parsed.data;

  const status: "DRAFT" | "PENDING_REVIEW" =
    action === "submit_review" ? "PENDING_REVIEW" : "DRAFT";

  await prisma.listing.create({
    data: {
      title,
      description,
      category: { connect: { id: categoryId } },
      seller: { connect: { id: seller.id } },
      images: imgs,
      startingBid,
      currentBid: null,
      bidIncrement: 50,
      reservePrice,
      size: size || null,
      condition: condition ? (condition as ListingConditionType) : null,
      status,
      endsAt: new Date(Date.now() + duration * 60 * 60 * 1000),
    },
  });

  revalidatePath("/seller/listings");
  return { success: true };
}

export async function deleteListing(formData: FormData) {
  const seller = await requireSeller();
  if (!seller) return;
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
  if (!listing || listing.sellerId !== seller.id) return;

  await prisma.listing.delete({ where: { id: listingId } });
  revalidatePath("/seller/listings");
}
