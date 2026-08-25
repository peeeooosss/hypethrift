"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sizeIsValidForCategory } from "@/lib/sizes";

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
  size: z.string().min(1, "Select a size"),
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

  if (images.length === 0) return { error: "Upload at least one image" };
  if (images.length > 8) return { error: "Maximum of 8 images allowed" };
  // Only accept URLs that came from our UploadThing app
  const allowedHost = (url: string) => {
    try {
      const host = new URL(url).hostname;
      return host.endsWith(".utfs.io") || host === "utfs.io" || host.endsWith(".ufs.sh") || host === "ufs.sh";
    } catch {
      return false;
    }
  };
  if (!images.every(allowedHost)) return { error: "One or more image URLs are invalid. Please re-upload." };

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

   const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
   if (!category) return { error: "Invalid category" };
   if (!sizeIsValidForCategory(size, category.slug)) {
     return { error: "Please select a valid size for this category" };
   }

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
       size,
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

async function requireBuyer() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  if (session.user.role !== "CUSTOMER") {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/seller");
  }
  return session.user.id;
}

export async function placeBid(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const userId = await requireBuyer();
  const listingId = formData.get("listingId")?.toString();
  const amount = Number(formData.get("amount"));

  if (!listingId) return { error: "Missing listing id" };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true, endsAt: true, startingBid: true, currentBid: true, bidIncrement: true, reservePrice: true },
  });
  if (!listing) return { error: "Listing not found" };
  if (listing.sellerId === userId) return { error: "You cannot bid on your own listing" };
  if (listing.status !== "ACTIVE") return { error: "This auction is not active" };
  if (new Date(listing.endsAt) <= new Date()) return { error: "This auction has ended" };

  const base = listing.currentBid ?? listing.startingBid;
  const minimum = base + listing.bidIncrement;
  if (!Number.isInteger(amount) || amount < minimum) return { error: `Bid must be at least ₹${minimum}` };
  if (listing.reservePrice && amount < listing.reservePrice) {
    return { error: `Bid must meet the reserve price of ₹${listing.reservePrice}` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.bid.create({
        data: { amount, listingId: listing.id, bidderId: userId },
      });

      // Atomic compare-and-set: only writes if the auction is still live and
      // `amount` still beats the current bid by at least one increment.
      const updated = await tx.$executeRaw`
        UPDATE "Listing"
        SET "currentBid" = ${amount}, "bidCount" = "bidCount" + 1, "updatedAt" = now()
        WHERE "id" = ${listing.id}
          AND "status" = 'ACTIVE'
          AND "endsAt" > now()
          AND (
            ("currentBid" IS NOT NULL AND ${amount} >= "currentBid" + "bidIncrement")
            OR ("currentBid" IS NULL AND ${amount} >= "startingBid" + "bidIncrement")
          )
      `;
      if (updated !== 1) {
        throw new Error("OUTBID_RACE");
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OUTBID_RACE") {
      return { error: "You were outbid while placing your bid. Please bid again." };
    }
    return { error: "Could not place your bid. Please try again." };
  }

  revalidatePath(`/listing/${listingId}`);
  revalidatePath(`/listing/${listingId}/bids`);
  revalidatePath("/listings");
  revalidatePath("/");
  return { success: true, amount };
}
