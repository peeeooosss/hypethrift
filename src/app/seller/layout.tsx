import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/listings", label: "Listings" },
  { href: "/seller/listings/new", label: "New Drop" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/earnings", label: "Earnings" },
  { href: "/seller/credits", label: "Listing Credits" },
  { href: "/seller/verification", label: "Verification" },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/account");

  return (
    <div className="min-h-screen bg-cream font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 py-8">
        <aside className="md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-4 py-2 rounded-full border-2 border-ink font-black uppercase text-xs hover:bg-acid hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/account" className="whitespace-nowrap px-4 py-2 rounded-full border-2 border-dashed border-ink font-black uppercase text-xs text-gray-500">
              ← My Account
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="w-full whitespace-nowrap px-4 py-2 rounded-full border-2 border-ink font-black uppercase text-xs hover:bg-ink hover:text-white transition-colors">
                Sign Out
              </button>
            </form>
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
