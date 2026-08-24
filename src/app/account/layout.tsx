import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/bids", label: "Bids" },
  { href: "/account/saved", label: "Saved" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/support", label: "Support" },
];

const SELLER_LINK = { href: "/seller/register", label: "Create seller account" };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "SELLER") redirect("/seller");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-cream font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 py-8">
        <aside className="md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-4 py-2 rounded-full border-2 border-ink font-black uppercase text-xs hover:bg-acid transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {(session.user.role === "CUSTOMER" && session.user.sellerStatus !== "APPROVED") && (
              <Link
                href={SELLER_LINK.href}
                className="whitespace-nowrap px-4 py-2 rounded-full border-2 border-bubblegum bg-bubblegum text-ink font-black uppercase text-xs hover:bg-acid transition-colors"
              >
                {SELLER_LINK.label}
              </Link>
            )}
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="mt-4"
          >
            <button className="w-full border-2 border-ink px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-ink hover:text-white transition-colors">
              Sign Out
            </button>
          </form>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
