"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyStoreName } from "@/lib/store-data";

async function requireApprovedSeller() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  if (session.user.role !== "SELLER" || session.user.sellerStatus !== "APPROVED") {
    redirect("/account");
  }
  return session.user;
}

const ALLOWED_LOGO_HOSTS = ["utfs.io", "ufs.sh"];

function isValidLogoUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_LOGO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export async function updateStoreSettings(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const user = await requireApprovedSeller();

  const storeName = formData.get("storeName")?.toString().trim() ?? "";
  const storeDescription = formData.get("storeDescription")?.toString() ?? "";
  const instagramUrl = formData.get("instagramUrl")?.toString().trim() ?? "";
  const upiId = formData.get("upiId")?.toString().trim() ?? "";
  const storeLogo = formData.get("storeLogo")?.toString().trim() ?? "";

  if (storeName.length < 2 || storeName.length > 30) {
    return { error: "Store name must be between 2 and 30 characters" };
  }
  if (instagramUrl && !/^https:\/\/(www\.)?instagram\.com\/.+/.test(instagramUrl)) {
    return { error: "Instagram link must be a full https://instagram.com/... URL" };
  }
  if (upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
    return { error: "Invalid UPI ID. Format: name@bank" };
  }
  if (storeLogo && !isValidLogoUrl(storeLogo)) {
    return { error: "Store logo must come from our upload service" };
  }

  const current = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    select: { storeName: true, storeSlug: true },
  });
  if (!current) return { error: "Seller profile not found. Please contact support." };

  let newSlug = current.storeSlug ?? slugifyStoreName(storeName);
  if (current.storeName !== storeName) {
    const candidate = slugifyStoreName(storeName);
    const clash = await prisma.sellerProfile.findUnique({ where: { storeSlug: candidate } });
    if (!clash || clash.userId === user.id) {
      // Slug follows the display name; only applied when unique.
      newSlug = candidate;
    } else {
      return { error: "That store name is already taken. Please try another one." };
    }
  }

  await prisma.sellerProfile.update({
    where: { userId: user.id },
    data: {
      storeName,
      storeDescription: storeDescription || null,
      instagramUrl: instagramUrl || null,
      upiId: upiId || null,
      storeLogo: storeLogo || null,
      storeSlug: newSlug,
    },
  });

  revalidatePath("/seller/plan");
  revalidatePath("/seller/store");
  revalidatePath(`/store/${newSlug}`);
  revalidatePath("/");
  return { success: true };
}