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
      const path = nextUrl.pathname;

      if (path === "/seller" || path === "/seller/register" || path === "/seller/verification" || path === "/admin/login") {
        return true;
      }

      if (path.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        return role === "ADMIN";
      }

      if (path.startsWith("/seller")) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/seller", nextUrl));
        }
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
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "SELLER" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
