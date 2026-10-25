import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "HypeThrift — The Walkable Thrift Mall",
    template: "%s · HypeThrift",
  },
  description:
    "Step into the HypeThrift mall. Bid live in the arena, shop authenticated sneakers, streetwear, vintage, denim, bags and jewelry, or buy instantly from independent sellers.",
  keywords: ["thrift", "auction", "streetwear", "sneakers", "vintage", "India", "marketplace"],
  openGraph: {
    title: "HypeThrift — The Walkable Thrift Mall",
    description: "Bid. Win. Flex. Repeat. Authenticated thrift drops and one-of-one finds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F0EA",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
