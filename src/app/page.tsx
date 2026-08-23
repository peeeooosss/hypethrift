import LiveDropLandingPage from "@/components/home/LiveDropLandingPage";
import LiveAuctionsStrip from "@/components/home/LiveAuctionsStrip";

export const revalidate = 0;

export default async function HomePage() {
  return (
    <>
      <LiveDropLandingPage />
      <LiveAuctionsStrip />
    </>
  );
}
