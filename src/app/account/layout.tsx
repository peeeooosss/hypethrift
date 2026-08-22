import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/bids", label: "Bids" },
  { href: "/account/saved", label: "Saved" },
  { href: "/account/addresses", label: "Addresses" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="sticky top-0 z-40 bg-white border-b-2 border-ink">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <Link href="/" className="text-xl font-black uppercase tracking-tighter">
            HypeThrift
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-600">{session.user.name ?? session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="bg-ink text-white px-4 py-2 rounded-full text-xs font-black uppercase border-2 border-ink hover:bg-bubblegum hover:text-ink transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

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
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
