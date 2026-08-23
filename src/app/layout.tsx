import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "HypeThrift - Live Drops by Category",
  description: "Gen Z thrift auction marketplace. Bid on authenticated sneaker, streetwear and vintage drops — live now.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const liveCount = await prisma.listing.count({
    where: { status: "ACTIVE", endsAt: { gt: new Date() } },
  });
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <Navbar liveCount={liveCount} />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
