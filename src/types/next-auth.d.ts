import type { UserRole } from "../../prisma/generated/client/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isBanned?: boolean;
      sellerStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    roleCheckedAt?: number;
    isBanned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    sellerStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
    roleCheckedAt?: number;
    banned?: boolean;
  }
}
