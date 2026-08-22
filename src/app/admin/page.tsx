import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [users, sellers, listings, orders, categories] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.listing.count(),
    prisma.order.count(),
    prisma.category.count(),
  ]);

  const cards = [
    { label: "Users", value: users, href: "/admin/users" },
    { label: "Sellers", value: sellers, href: "/admin/sellers" },
    { label: "Listings", value: listings, href: "/admin/listings" },
    { label: "Orders", value: orders, href: "/admin/orders" },
    { label: "Categories", value: categories, href: "/admin/categories" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black uppercase text-white">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white border-2 border-ink shadow-brut-md rounded-2xl p-5 hover:-translate-y-1 transition-transform"
          >
            <p className="text-4xl font-black">{c.value}</p>
            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
