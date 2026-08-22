import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const revalidate = 0;

const ACTION_CARDS = [
  { href: "/account/orders", label: "My Orders", icon: "🛒" },
  { href: "/account/bids", label: "My Bids", icon: "🔨" },
  { href: "/account/saved", label: "Saved Items", icon: "❤️" },
  { href: "/account/addresses", label: "Addresses", icon: "📍" },
];

export default async function AccountProfilePage() {
  const session = await auth();
  const user = session?.user;

  const [ordersCount, bidsCount, savedCount, addressesCount] = user
    ? await Promise.all([
        prisma.order.count({ where: { buyerId: user.id } }),
        prisma.bid.count({ where: { bidderId: user.id } }),
        prisma.savedItem.count({ where: { userId: user.id } }),
        prisma.address.count({ where: { userId: user.id } }),
      ])
    : [0, 0, 0, 0];

  if (!user) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
        <p className="text-gray-500 font-bold mb-4">You must be signed in to view this page.</p>
        <Link
          href="/login"
          className="inline-block bg-ink text-white border-2 border-ink px-5 py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const isSeller = ["SELLER", "ADMIN"].includes(user.role);
  const canApply = user.role === "CUSTOMER" && user.sellerStatus !== "APPROVED";

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-black uppercase mb-2">My Profile</h1>
        <div className="flex items-center gap-4 mt-4">
          {user.image ? (
            <img src={user.image} alt={user.name ?? ""} className="w-16 h-16 rounded-full object-cover border-2 border-ink" />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-ink bg-ink/5 flex items-center justify-center text-3xl">{user.name?.[0] ?? "👤"}</div>
          )}
          <div>
            <p className="text-xl font-black">{user.name ?? user.email}</p>
            <p className="text-sm font-bold text-gray-500">{user.email}</p>
            <span
              className={`inline-block mt-1 text-xs font-black uppercase px-2 py-1 rounded-full border border-ink ${
                user.role === "ADMIN"
                  ? "bg-bubblegum text-ink"
                  : user.role === "SELLER"
                  ? "bg-acid text-ink"
                  : "bg-white text-ink"
              }`}
            >
              {user.role === "ADMIN" ? "Admin" : user.role === "SELLER" ? "Seller" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTION_CARDS.map((c) => {
          const counts = {
            "/account/orders": ordersCount,
            "/account/bids": bidsCount,
            "/account/saved": savedCount,
            "/account/addresses": addressesCount,
          };
          const badge = counts[c.href as keyof typeof counts];
          return (
            <Link key={c.href} href={c.href} className="group">
              <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 text-center h-full transition-all group-hover:translate-y-[-2px] group-hover:shadow-brut-2xl">
                <div className="text-4xl mb-2">{c.icon}</div>
                <h2 className="text-lg font-black uppercase mb-1">{c.label}</h2>
                <p className="text-xs font-bold text-gray-500 uppercase">
                  {badge} {badge === 1 ? "item" : "items"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {canApply && (
          <Link
            href="/apply-seller"
            className="bg-bubblegum border-2 border-ink shadow-brut-lg rounded-3xl p-5 text-center font-black uppercase hover:translate-y-[-2px] hover:shadow-brut-2xl transition-all"
          >
            🚀 Become a Seller
          </Link>
        )}
        {isSeller && (
          <Link
            href="/seller"
            className="bg-acid border-2 border-ink shadow-brut-lg rounded-3xl p-5 text-center font-black uppercase hover:translate-y-[-2px] hover:shadow-brut-2xl transition-all"
          >
            📊 Seller Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
