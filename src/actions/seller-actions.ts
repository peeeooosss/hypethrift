"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function applyAsSeller(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const note = formData.get("note")?.toString();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { sellerStatus: "PENDING", sellerNote: note ?? null },
  });

  revalidatePath("/apply-seller");
}

export async function requestPayout() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/account");
  if (session.user.isBanned) redirect("/login");

  const userId = session.user.id;

  const orders = await prisma.order.findMany({
    where: { sellerId: userId, status: "PAID" },
    select: { finalPrice: true },
  });

  const totalPaid = orders.reduce((sum, o) => sum + o.finalPrice, 0);

  const completedPayouts = await prisma.payout.findMany({
    where: { sellerId: userId, status: "COMPLETED" },
    select: { amount: true },
  });
  const totalPaidOut = completedPayouts.reduce((sum, p) => sum + p.amount, 0);

  const pendingPayouts = await prisma.payout.findMany({
    where: { sellerId: userId, status: "PENDING" },
    select: { amount: true },
  });
  const pending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  const available = totalPaid - totalPaidOut - pending;
  const platformFee = Math.round(available * 0.1);
  const payoutAmount = available - platformFee;

  if (payoutAmount <= 0) {
    return { error: "No earnings available to withdraw" };
  }

  await prisma.payout.create({
    data: {
      sellerId: userId,
      amount: payoutAmount,
      method: "bank",
      status: "PENDING",
    },
  });

  revalidatePath("/seller/earnings");
  return { success: true, amount: payoutAmount };
}
