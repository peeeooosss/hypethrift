import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const MENU = [
  { href: "/account/profile", label: "Profile", description: "Manage your personal details" },
  { href: "/account/orders", label: "Orders", description: "Track your winning items" },
  { href: "/account/bids", label: "My Bids", description: "See live and winning bids" },
  { href: "/account/saved", label: "Saved", description: "Your saved drops" },
  { href: "/account/addresses", label: "Addresses", description: "Manage delivery addresses" },
  { href: "/account/support", label: "Support", description: "Get help from HypeThrift" },
];

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "SELLER") redirect("/seller");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">My HypeThrift</p>
        <h1 className="text-3xl font-black uppercase mt-1">Your Menu</h1>
        <p className="text-gray-500 font-bold mt-2">Choose what you want to manage.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 hover:-translate-y-1 hover:bg-acid transition-all"
          >
            <h2 className="text-xl font-black uppercase">{item.label}</h2>
            <p className="text-sm text-gray-500 font-bold mt-1">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
