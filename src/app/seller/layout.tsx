import Link from "next/link";
export default function SellerPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cream font-sans">{children}</main>
  );
}
