import { prisma } from "@/lib/prisma";
import { SELLER_PLANS, type SellerPlanId } from "@/lib/platform";

export interface EffectivePlan {
  plan: SellerPlanId;
  label: string;
  listingLimit: number;
  amount: number;
  planExpiresAt: Date | null;
}

export const FREE_PLAN: EffectivePlan = {
  plan: "FREE",
  label: SELLER_PLANS.FREE.label,
  listingLimit: SELLER_PLANS.FREE.listingLimit,
  amount: SELLER_PLANS.FREE.amount,
  planExpiresAt: null,
};

export async function getEffectivePlan(userId: string): Promise<EffectivePlan> {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!profile || profile.plan === "FREE") return FREE_PLAN;

  const config = SELLER_PLANS[profile.plan as SellerPlanId] ?? SELLER_PLANS.FREE;
  if (!profile.planExpiresAt || profile.planExpiresAt <= new Date()) return FREE_PLAN;

  return { plan: profile.plan as SellerPlanId, ...config, planExpiresAt: profile.planExpiresAt };
}

export function countRetailListings(sellerId: string) {
  return prisma.listing.count({
    where: {
      sellerId,
      listingMode: { in: ["RETAIL", "BOTH"] },
      status: { in: ["PENDING_REVIEW", "ACTIVE"] },
    },
  });
}

export async function getRetailQuota(userId: string) {
  const [plan, used] = await Promise.all([getEffectivePlan(userId), countRetailListings(userId)]);
  return { ...plan, used };
}

export function isRetailMode(mode: string | null | undefined) {
  return mode === "RETAIL" || mode === "BOTH";
}