"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminWhatsAppUrl } from "@/lib/platform";

export async function applyAsSeller(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const storeName = formData.get("storeName")?.toString().trim();
  const storeDescription = formData.get("storeDescription")?.toString().trim() || null;
  const location = formData.get("location")?.toString().trim() || null;
  const whatsappNumber = formData.get("whatsappNumber")?.toString().trim();
  const returnPolicy = formData.get("returnPolicy")?.toString().trim() || null;
  const agreementAccepted = formData.get("agreementAccepted") === "on";

  if (!storeName || !whatsappNumber || !agreementAccepted) {
    redirect("/apply-seller?error=complete-form");
  }

  await prisma.sellerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      storeName,
      storeDescription,
      location,
      whatsappNumber,
      returnPolicy,
      acceptedAgreement: true,
      acceptedAt: new Date(),
    },
    update: {
      storeName,
      storeDescription,
      location,
      whatsappNumber,
      returnPolicy,
      acceptedAgreement: true,
      acceptedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { sellerStatus: "PENDING", sellerNote: null },
  });

  revalidatePath("/apply-seller");
  revalidatePath("/admin/sellers");

  // Redirect to admin WhatsApp with seller details
  const message = [
    "New Seller Application Submitted",
    `Store Name: ${storeName}`,
    `Store Description: ${storeDescription || "N/A"}`,
    `Location: ${location || "N/A"}`,
    `WhatsApp: ${whatsappNumber}`,
    `Return Policy: ${returnPolicy || "N/A"}`,
    `Seller Email: ${session.user.email}`,
    `Seller Name: ${session.user.name ?? "N/A"}`,
    `User ID: ${session.user.id}`,
  ].join("\n");

  redirect(adminWhatsAppUrl(message));
}
