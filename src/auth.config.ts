import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [], // providers are added in src/lib/auth.ts (Node runtime only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isBanned = Boolean((auth?.user as { isBanned?: boolean } | undefined)?.isBanned);
      const path = nextUrl.pathname;

      if (path === "/seller" || path === "/seller/register" || path === "/seller/verification" || path === "/admin/login") {
        return true;
      }

      if (!isLoggedIn) {
        if (path.startsWith("/seller")) {
          return Response.redirect(new URL("/seller", nextUrl));
        }
        return false;
      }
      if (isBanned) return false;

      if (path.startsWith("/admin")) {
        return role === "ADMIN";
      }

      if (path.startsWith("/seller")) {
        if (role === "ADMIN") return true;
        if (role !== "SELLER") {
          return Response.redirect(new URL("/account", nextUrl));
        }
        const sellerStatus = auth?.user?.sellerStatus;
        const isApproved = sellerStatus === "APPROVED";
        if (!isApproved && path !== "/seller/verification") {
          return Response.redirect(new URL("/seller/verification", nextUrl));
        }
        return true;
      }

      if (path.startsWith("/account")) {
        return true;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sellerStatus = (user as { sellerStatus?: unknown }).sellerStatus ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "SELLER" | "ADMIN";
        session.user.sellerStatus = token.sellerStatus as "PENDING" | "APPROVED" | "REJECTED" | null | undefined;
        session.user.sellerNote = token.sellerNote as string | null | undefined;
        (session.user as { isBanned?: boolean }).isBanned = token.banned as boolean | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
