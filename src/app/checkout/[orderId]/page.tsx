import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function LegacyCheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: orderId, buyerId: session.user.id },
    select: { listingId: true },
  });
  if (!order) notFound();
  redirect(`/account/bids/${encodeURIComponent(order.listingId)}/contact`);
}
