"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminWhatsAppUrl, LISTING_PACKAGES } from "@/lib/platform";

async function requireApprovedSeller() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  if (session.user.role !== "SELLER" || session.user.sellerStatus !== "APPROVED") {
    redirect("/account");
  }
  return session.user;
}

export async function requestListingCredits(formData: FormData) {
  const user = await requireApprovedSeller();
  const packageId = formData.get("packageId")?.toString();
  const paidVia = formData.get("paidVia")?.toString() ?? "UPI";
  const selected = LISTING_PACKAGES.find((item) => item.id === packageId);

  if (!selected) redirect("/seller/credits?error=package");

  await prisma.creditPurchase.create({
    data: {
      userId: user.id,
      package: selected.label,
      amount: selected.amount,
      credits: selected.credits,
      paidVia,
      status: "WAITING_VERIFICATION",
    },
  });

  const message = [
    "Hi HypeThrift, I have paid for listing credits.",
    `Package: ${selected.label}`,
    `Amount: ₹${selected.amount}`,
    `Seller: ${user.name ?? "Seller"}`,
    `User ID: ${user.id}`,
    `Paid via: ${paidVia}`,
    "Screenshot attached.",
  ].join("\n");

  redirect(adminWhatsAppUrl(message));
}

export async function approveCreditPurchase(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const purchaseId = formData.get("purchaseId")?.toString();
  if (!purchaseId) return;

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.creditPurchase.findFirst({
      where: { id: purchaseId, status: "WAITING_VERIFICATION" },
    });
    if (!purchase) return;

    await tx.creditPurchase.update({
      where: { id: purchase.id },
      data: { status: "COMPLETED" },
    });
    await tx.user.update({
      where: { id: purchase.userId },
      data: { listingCredits: { increment: purchase.credits } },
    });
  });

  revalidatePath("/admin/credits");
  revalidatePath("/seller/credits");
  revalidatePath("/seller/listings/new");
}

export async function rejectCreditPurchase(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const purchaseId = formData.get("purchaseId")?.toString();
  if (!purchaseId) return;

  await prisma.creditPurchase.updateMany({
    where: { id: purchaseId, status: "WAITING_VERIFICATION" },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/credits");
  revalidatePath("/seller/credits");
}
