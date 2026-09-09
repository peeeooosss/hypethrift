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

const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description is too short"),
  categoryId: z.string().min(1, "Select a category"),
  startingBid: z.coerce.number().int().min(1, "Starting bid is required"),
  reservePrice: z.coerce.number().int().optional().or(z.literal("").transform(() => undefined)),
  size: z.string().min(1, "Select a size"),
  condition: z.enum(["NEW", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"]).optional(),
  duration: z.enum(["1", "4", "12", "24", "48", "72", "168", "336", "720"]).transform(Number),
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

  if (reservePrice !== undefined && reservePrice < startingBid) {
    return { error: "Reserve price must be higher than the starting bid" };
  }

   const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
   if (!category) return { error: "Invalid category" };
   if (!sizeIsValidForCategory(size, category.slug)) {
     return { error: "Please select a valid size for this category" };
   }

   const status: "DRAFT" | "PENDING_REVIEW" =
    action === "submit_review" ? "PENDING_REVIEW" : "DRAFT";

  const mode = formData.get("mode")?.toString();
  const isUpcomingIntent = mode === "upcoming";

  if (isUpcomingIntent && action === "submit_review") {
    const upcomingCount = await prisma.listing.count({
      where: {
        sellerId: seller.id,
        OR: [
          { status: "UPCOMING" },
          { status: "PENDING_REVIEW", upcomingIntent: true },
        ],
      },
    });
    if (upcomingCount >= 5) {
      return { error: "You can have at most 5 upcoming items in your showcase. Launch or remove one first." };
    }
  }

  // Keep launch intent separate from the optional buyer-facing schedule.
  const rawScheduled = formData.get("startsAt")?.toString();
  let scheduledAt: Date | null = null;
  if (isUpcomingIntent && action === "submit_review") {
    if (rawScheduled) {
      const parsedDate = new Date(rawScheduled);
      if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) scheduledAt = parsedDate;
    }
  }

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
      startsAt: scheduledAt,
      upcomingIntent: isUpcomingIntent,
      durationHours: duration,
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

const editListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description is too short"),
  categoryId: z.string().min(1, "Select a category"),
  startingBid: z.coerce.number().int().min(1, "Starting bid is required"),
  reservePrice: z.coerce.number().int().optional().or(z.literal("").transform(() => undefined)),
  size: z.string().min(1, "Select a size"),
  condition: z.enum(["NEW", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"]).optional(),
  duration: z.enum(["1", "4", "12", "24", "48", "72", "168", "336", "720"]).transform(Number),
});

export async function updateListing(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const seller = await requireSeller();
  if (!seller) return { error: "Unauthorized" };
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return { error: "Missing listing id" };

  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true, bidCount: true, endsAt: true },
  });
  if (!existing || existing.sellerId !== seller.id) return { error: "Listing not found" };
  if (existing.bidCount > 0) return { error: "This auction already has bids. Listing details are locked." };
  if (!["DRAFT", "PENDING_REVIEW", "UPCOMING", "ACTIVE"].includes(existing.status)) {
    return { error: "This listing can no longer be edited" };
  }

  const rawImages = formData.get("images")?.toString() ?? "";
  const images = rawImages ? rawImages.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (images.length === 0) return { error: "Upload at least one image" };
  if (images.length > 8) return { error: "Maximum of 8 images allowed" };
  const allowedHost = (url: string) => {
    try {
      const host = new URL(url).hostname;
      return host.endsWith(".utfs.io") || host === "utfs.io" || host.endsWith(".ufs.sh") || host === "ufs.sh";
    } catch {
      return false;
    }
  };
  if (!images.every(allowedHost)) return { error: "One or more image URLs are invalid. Please re-upload." };

  const parsed = editListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    startingBid: formData.get("startingBid"),
    reservePrice: formData.get("reservePrice"),
    size: formData.get("size"),
    condition: formData.get("condition"),
    duration: formData.get("duration"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { title, description, categoryId, startingBid, reservePrice, size, condition, duration } = parsed.data;
  if (reservePrice !== undefined && reservePrice < startingBid) {
    return { error: "Reserve price must be higher than the starting bid" };
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
  if (!category) return { error: "Invalid category" };
  if (!sizeIsValidForCategory(size, category.slug)) {
    return { error: "Please select a valid size for this category" };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      title,
      description,
      category: { connect: { id: categoryId } },
      images,
      startingBid,
      // Reserve is only enforced at auction completion; clear it when blanked.
      reservePrice: reservePrice ?? null,
      size,
      condition: condition ? (condition as ListingConditionType) : null,
      durationHours: duration,
      // Editing a live listing with no bids resets its clock so buyers see a
      // fair auction; draft/pending listings keep their original schedule.
      ...(existing.status === "ACTIVE" ? { endsAt: new Date(Date.now() + duration * 60 * 60 * 1000) } : {}),
    },
  });

  revalidatePath("/seller/listings");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/");
  return { success: true };
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

export async function toggleRequestLive(prevState: { live?: boolean } | null, formData: FormData) {
  const userId = await requireBuyer();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return { live: false };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { status: true, sellerId: true },
  });
  if (!listing || listing.status !== "UPCOMING" || listing.sellerId === userId) return { live: false };

  const existing = await prisma.upcomingVote.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });

  if (existing) {
    await prisma.upcomingVote.delete({ where: { id: existing.id } });
    revalidatePath("/");
    revalidatePath(`/listing/${listingId}`);
    revalidatePath("/upcoming");
    revalidatePath("/seller/dashboard");
    return { live: false };
  }

  await prisma.upcomingVote.create({
    data: { userId, listingId },
  });
  revalidatePath("/");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/upcoming");
  revalidatePath("/seller/dashboard");
  return { live: true };
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
  // Standard reserve behaviour: bids below the reserve are accepted while the
  // auction is live; the reserve is only enforced when deciding the winner.

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

export async function launchUpcoming(formData: FormData) {
  const seller = await requireSeller();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return { error: "Missing listing id" };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true, durationHours: true },
  });
  if (!listing || listing.sellerId !== seller.id) return { error: "Listing not found" };
  if (listing.status !== "UPCOMING") return { error: "This listing is not upcoming" };

  // Reserve must be met check doesn't apply here; launching just requires a credit.
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, status: true },
    });
    if (!current || current.sellerId !== seller.id || current.status !== "UPCOMING") return null;

    const credit = await tx.user.updateMany({
      where: { id: seller.id, listingCredits: { gt: 0 } },
      data: { listingCredits: { decrement: 1 } },
    });
    if (credit.count !== 1) return null;

    await tx.listing.update({
      where: { id: listing.id },
      data: {
        status: "ACTIVE",
        upcomingIntent: false,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + listing.durationHours * 60 * 60 * 1000),
      },
    });
    return true;
  });

  if (!result) redirect("/seller/credits?error=listing_credit_required");

  revalidatePath("/seller/dashboard");
  revalidatePath("/seller/listings");
  revalidatePath("/");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/upcoming");
  return { success: true };
}

export async function removeUpcoming(formData: FormData) {
  const seller = await requireSeller();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true },
  });
  if (!listing || listing.sellerId !== seller.id || listing.status !== "UPCOMING") return;

  await prisma.upcomingVote.deleteMany({ where: { listingId } });
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "DRAFT", startsAt: null, upcomingIntent: false },
  });
  revalidatePath("/seller/dashboard");
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/upcoming");
}

export async function promoteDraftToUpcoming(formData: FormData) {
  const seller = await requireSeller();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return { error: "Missing listing id" };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true },
  });
  if (!listing || listing.sellerId !== seller.id) return { error: "Listing not found" };
  if (listing.status !== "DRAFT") return { error: "Only draft listings can be promoted to upcoming" };

  const upcomingCount = await prisma.listing.count({
    where: {
      sellerId: seller.id,
      OR: [
        { status: "UPCOMING" },
        { status: "PENDING_REVIEW", upcomingIntent: true },
      ],
    },
  });
  if (upcomingCount >= 5) {
    return { error: "You can have at most 5 upcoming items. Launch or remove one first." };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "UPCOMING", upcomingIntent: true },
  });

  revalidatePath("/seller/dashboard");
  revalidatePath("/seller/listings");
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath(`/listing/${listingId}`);
  return { success: true };
}
