import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getRetailOrder(orderId: string) {
  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: {
      listing: { select: { id: true, title: true, images: true, size: true, condition: true, category: { select: { emoji: true } } } },
      seller: {
        select: {
          name: true,
          email: true,
          sellerProfile: { select: { storeName: true, storeSlug: true, instagramUrl: true, whatsappNumber: true } },
        },
      },
    },
  });
  if (!order) return null;
  return { ...order, total: order.finalPrice + order.connectionFee };
}

export async function getBuyerRetailOrders(userId: string) {
  const rows = await prisma.retailOrder.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, images: true } },
      seller: {
        select: {
          sellerProfile: { select: { storeName: true, storeSlug: true } },
        },
      },
    },
  });
  return rows.map((r) => ({ ...r, total: r.finalPrice + r.connectionFee }));
}

export async function getSellerRetailOrders(sellerId: string) {
  const rows = await prisma.retailOrder.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, images: true, size: true } },
    },
  });
  return rows.map((r) => ({
    ...r,
    total: r.finalPrice + r.connectionFee,
    addressVisible: ["PAYMENT_VERIFIED", "ADDRESS_RELEASED", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"].includes(r.status),
  }));
}

export const getRetailOrdersAdmin = unstable_cache(
  async () => {
    const rows = await prisma.retailOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        listing: { select: { id: true, title: true, images: true } },
        buyer: { select: { name: true, email: true, phone: true } },
        seller: {
          select: {
            name: true,
            email: true,
            sellerProfile: { select: { storeName: true, storeSlug: true, upiId: true, whatsappNumber: true } },
          },
        },
      },
    });
    return rows.map((r) => ({ ...r, total: r.finalPrice + r.connectionFee }));
  },
  ["admin-retail-orders"],
  { revalidate: 0 },
);

export async function getEligibleRetailPayouts() {
  const orders = await prisma.retailOrder.findMany({
    where: { status: "COMPLETED", payoutAt: null },
    select: { sellerId: true, finalPrice: true, commission: true },
  });
  const map = new Map<string, { orders: number; total: number; commission: number }>();
  for (const o of orders) {
    const entry = map.get(o.sellerId) ?? { orders: 0, total: 0, commission: 0 };
    entry.orders += 1;
    entry.total += o.finalPrice;
    entry.commission += o.commission ?? Math.round(o.finalPrice * 0.08);
    map.set(o.sellerId, entry);
  }
  const sellers = await prisma.user.findMany({
    where: { id: { in: [...map.keys()] } },
    select: {
      id: true,
      name: true,
      email: true,
      sellerProfile: { select: { storeName: true, upiId: true } },
    },
  });
  return sellers
    .map((seller) => {
      const m = map.get(seller.id)!;
      return {
        sellerId: seller.id,
        storeName: seller.sellerProfile?.storeName ?? seller.name ?? seller.email,
        upiId: seller.sellerProfile?.upiId ?? null,
        orders: m.orders,
        gross: m.total,
        commission: m.commission,
        payout: m.total - m.commission,
      };
    })
    .sort((a, b) => b.payout - a.payout);
}