import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sellers", label: "Seller Apps" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/featured", label: "Featured ⚡" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/contact-fees", label: "Contact Fees" },
  { href: "/admin/credits", label: "Credits" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/support", label: "Support" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  return (
    <div className="min-h-screen bg-ink text-white font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 py-8">
        <aside className="md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="mt-4"
          >
            <button className="w-full border-2 border-white px-4 py-2 rounded-full text-xs font-black uppercase hover:bg-white hover:text-ink transition-colors">
              Sign Out
            </button>
          </form>
        </aside>
        <main className="flex-1 text-ink">{children}</main>
      </div>
    </div>
  );
}
