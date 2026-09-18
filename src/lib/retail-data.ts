import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getRetailOrder(orderId: string) {
  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: {
      listing: { select: { id: true, title: true, images: true, size: true, condition: true } },
      seller: {
        select: {
          name: true,
          email: true,
          sellerProfile: { select: { storeName: true, storeSlug: true, instagramUrl: true } },
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
      buyer: { select: { name: true, phone: true } },
    },
  });
  return rows.map((r) => ({ ...r, total: r.finalPrice + r.connectionFee }));
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
            sellerProfile: { select: { storeName: true, storeSlug: true, upiId: true } },
          },
        },
      },
    });
    return rows.map((r) => ({ ...r, total: r.finalPrice + r.connectionFee }));
  },
  ["admin-retail-orders"],
  { revalidate: 15 },
);