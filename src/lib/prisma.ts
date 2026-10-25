import { PrismaClient } from "../../prisma/generated/client/client";
import * as PrismaEnums from "../../prisma/generated/client/enums";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

export const enums = PrismaEnums;
export type ListingMode = PrismaEnums.ListingMode;
export type ListingStatus = PrismaEnums.ListingStatus;
export type OrderStatus = PrismaEnums.OrderStatus;
export type UserRole = PrismaEnums.UserRole;
export type SellerStatus = PrismaEnums.SellerStatus;
export type SellerPlan = PrismaEnums.SellerPlan;
export type RetailOrderStatus = PrismaEnums.RetailOrderStatus;
export type ListingCondition = PrismaEnums.ListingCondition;
export type PayoutStatus = PrismaEnums.PayoutStatus;
export type CreditPurchaseStatus = PrismaEnums.CreditPurchaseStatus;
export type SubscriptionStatus = PrismaEnums.SubscriptionStatus;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
