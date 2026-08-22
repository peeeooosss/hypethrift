import LiveDropLandingPage from "@/components/home/LiveDropLandingPage";
import LiveAuctionsStrip from "@/components/home/LiveAuctionsStrip";

export default async function HomePage() {
  return (
    <>
      <LiveDropLandingPage />
      <LiveAuctionsStrip />
    </>
  );
}
