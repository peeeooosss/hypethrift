import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getLiveCount } from "@/lib/public-data";

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
  const [liveCount, session] = await Promise.all([getLiveCount(), auth()]);

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
