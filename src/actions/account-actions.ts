"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isBanned) redirect("/login");
  return session.user.id;
}

const addressSchema = z.object({
  label: z.string().min(1, "Label is required (e.g. Home, Work)"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  country: z.string().default("India"),
});

export async function createAddress(formData: FormData) {
  const userId = await requireUser();

  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    country: formData.get("country") || "India",
  });

  if (!parsed.success) {
    revalidatePath("/account/addresses");
    return;
  }

  const existing = await prisma.address.count({ where: { userId } });
  const data = {
    ...parsed.data,
    isDefault: existing === 0,
  };

  await prisma.address.create({
    data: { ...data, user: { connect: { id: userId } } },
  });

  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const userId = await requireUser();
  const addressId = formData.get("addressId")?.toString();
  if (!addressId) return;

  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return;

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);

  revalidatePath("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  const userId = await requireUser();
  const addressId = formData.get("addressId")?.toString();
  if (!addressId) return;

  await prisma.address.delete({ where: { id: addressId, userId } });
  revalidatePath("/account/addresses");
}

export async function saveListingAction(formData: FormData) {
  const userId = await requireUser();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  await prisma.savedItem.create({
    data: { user: { connect: { id: userId } }, listing: { connect: { id: listingId } } },
  });

  revalidatePath("/account/saved");
  revalidatePath(`/listing/${encodeURIComponent(listingId)}`);
  revalidatePath("/listings");
}

export async function unsaveListingAction(formData: FormData) {
  const userId = await requireUser();
  const listingId = formData.get("listingId")?.toString();
  if (!listingId) return;

  await prisma.savedItem.deleteMany({ where: { userId, listingId } });

  revalidatePath("/account/saved");
  revalidatePath(`/listing/${encodeURIComponent(listingId)}`);
  revalidatePath("/listings");
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------
const ticketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function createSupportTicket(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const userId = await requireUser();

  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.supportTicket.create({
    data: {
      userId,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });

  revalidatePath("/account/support");
  return { success: true };
}

export async function getSupportTickets() {
  const userId = await requireUser();
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupportTicket(ticketId: string) {
  const userId = await requireUser();
  return prisma.supportTicket.findUnique({
    where: { id: ticketId, userId },
  });
}
