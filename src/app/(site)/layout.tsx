import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getLiveCount } from "@/lib/public-data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const liveCount = await getLiveCount();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader liveCount={liveCount} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
