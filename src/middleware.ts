import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const runtime = 'nodejs';

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/account/:path*"],
};
