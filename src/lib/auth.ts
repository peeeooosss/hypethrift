import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.password) return null;
        if (user.isBanned) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          sellerStatus: user.sellerStatus ?? null,
          sellerNote: user.sellerNote ?? null,
          roleCheckedAt: Date.now(),
        };
      },
    }),
  ],
  callbacks: {
    // Node-runtime callback that refreshes the user's role from the DB,
    // throttled to once per minute so admin role/seller changes propagate
    // without forcing a full re-login.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sellerStatus = (user as { sellerStatus?: unknown }).sellerStatus ?? null;
        token.roleCheckedAt = (user as { roleCheckedAt?: number }).roleCheckedAt ?? Date.now();
        return token;
      }

      const now = Date.now();
      const lastCheck = Number(token.roleCheckedAt ?? 0);
      if (now > lastCheck + 60_000) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isBanned: true, sellerStatus: true, sellerNote: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.sellerStatus = dbUser.sellerStatus;
          token.sellerNote = dbUser.sellerNote;
          token.roleCheckedAt = now;
          token.banned = dbUser.isBanned ? true : undefined;
        }
      }

      // Mirror the edge-safe session callback so the session object
      // is populated consistently here too.
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
});
