import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { payForOrder } from "@/actions/auction-actions";

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

const ORDER_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: orderId, buyerId: session.user.id },
    include: {
      listing: { include: { category: true, seller: true } },
    },
  });

  if (!order) notFound();

  if (order.status !== "PENDING_PAYMENT") {
    redirect(`/account/orders`);
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-black uppercase">Checkout</h1>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl border-2 border-ink bg-gray-100 flex items-center justify-center text-4xl">
            {order.listing.category?.emoji ?? "📦"}
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase">{order.listing.title}</h2>
            <p className="text-sm text-gray-600 font-bold mt-1">
              {order.listing.category?.name ?? "Uncategorized"} · Size: {order.listing.size ?? "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6 text-center">
          <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
            <span className="text-xs uppercase font-black text-gray-500">Final Price</span>
            <p className="text-3xl font-black mt-1">{money(order.finalPrice)}</p>
          </div>
          <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
            <span className="text-xs uppercase font-black text-gray-500">Estimated Delivery</span>
            <p className="text-3xl font-black mt-1">3–5 days</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8">
        <h2 className="text-xl font-black uppercase mb-4">Shipping Address</h2>
        {addresses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 font-bold mb-4">No addresses saved.</p>
            <a
              href="/account/addresses"
              className="inline-block bg-ink text-white border-2 border-ink px-5 py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
            >
              Add an address
            </a>
          </div>
        ) : (
          <form action={async (formData: FormData) => { await payForOrder(formData); }}>
            <input type="hidden" name="orderId" value={order.id} />
            <fieldset className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className="flex items-start gap-3 p-3 border-2 border-ink/20 rounded-xl cursor-pointer hover:bg-ink/5 has-[:checked]:border-acid has-[:checked]:bg-acid/10"
                >
                  <input type="radio" name="addressId" value={addr.id} defaultChecked={addr.isDefault} className="mt-1" />
                  <div className="flex-1">
                    <p className="font-black">{addr.label}</p>
                    <p className="text-sm text-gray-600">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                    </p>
                    <p className="text-sm text-gray-600">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p className="text-xs text-gray-500">{addr.country}</p>
                  </div>
                  {addr.isDefault && <span className="text-xs font-black text-acid">DEFAULT</span>}
                </label>
              ))}
            </fieldset>

            <div className="mt-6 pt-6 border-t-2 border-dashed border-ink/20">
              <p className="text-xs uppercase font-black text-gray-500 mb-3">Payment Method</p>
              <div className="flex items-center gap-3 p-3 border-2 border-ink/20 rounded-xl">
                <div className="w-6 h-6 bg-ink/10 rounded-full flex items-center justify-center">✓</div>
                <span className="font-black">Manual Payment (Demo)</span>
              </div>
              <p className="text-xs text-gray-500 font-bold mt-2">
                In production this would integrate with Razorpay.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-acid border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase text-xl hover:bg-bubblegum transition-colors mt-4"
            >
              Pay {money(order.finalPrice)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
