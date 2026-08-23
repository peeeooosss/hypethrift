import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const revalidate = 0;

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

const ORDER_LABEL: Record<string, string> = {
  PENDING_CONTACT_FEE: "Contact fee required",
  WAITING_VERIFICATION: "Waiting for verification",
  CONTACT_FEE_PAID: "Contact fee paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
        <p className="text-gray-500 font-bold mb-4">Sign in to view your orders.</p>
        <Link href="/login" className="inline-block bg-ink text-white px-5 py-3 rounded-2xl font-black uppercase text-sm border-2 border-ink hover:bg-acid hover:text-ink">
          Sign in
        </Link>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { category: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-black uppercase">My Orders</h1>
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8 text-center">
          <p className="text-gray-500 font-bold mb-2">No orders yet.</p>
          <p className="text-sm text-gray-500 font-bold">
            Winning bids that complete checkout will appear here. Browse{" "}
            <Link href="/listings" className="underline font-black">live auctions</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black uppercase">My Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="block">
            <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 hover:bg-ink/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl border-2 border-ink bg-gray-100 flex items-center justify-center text-2xl">{o.listing.category?.emoji ?? "📦"}</div>
                  <div>
                    <p className="font-black uppercase line-clamp-1">{o.listing.title}</p>
                    <p className="text-xs text-gray-500 font-bold">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg block">{money(o.finalPrice)}</span>
                  <span className="text-xs font-black uppercase">{ORDER_LABEL[o.status] ?? o.status}</span>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="mt-1 inline-block text-xs font-black text-ink hover:underline"
                  >
                    View status →
                  </Link>
                  {(o.status === "PENDING_CONTACT_FEE" || o.status === "REJECTED") && (
                    <Link
                      href={`/account/orders/${o.id}`}
                      className="mt-1 inline-block text-xs font-black text-acid hover:underline"
                    >
                      Pay Now →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
