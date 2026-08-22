import { prisma } from "@/lib/prisma";
import LiveDropLandingPage from "@/components/home/LiveDropLandingPage";
import LiveAuctionsStrip from "@/components/home/LiveAuctionsStrip";
import Footer from "@/components/layout/Footer";

export const revalidate = 0;

export default async function HomePage() {
  const liveCount = await prisma.listing.count({
    where: { status: "ACTIVE", endsAt: { gt: new Date() } },
  });
  return (
    <>
      <LiveDropLandingPage liveCount={liveCount} />
      <LiveAuctionsStrip />
      <Footer />
    </>
  );
}
