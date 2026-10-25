import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/actions/admin-actions";
import OrderChecklist from "@/components/admin/OrderChecklist";
import WhatsAppMessageButton from "@/components/admin/WhatsAppMessageButton";
import { BUYER_TEMPLATES, resolveWhatsAppMessages, SELLER_TEMPLATES } from "@/lib/whatsapp-templates";

type OrderStatus = "PENDING_CONTACT_FEE" | "WAITING_VERIFICATION" | "CONTACT_FEE_PAID" | "COMPLETED" | "CANCELLED" | "REJECTED";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_CONTACT_FEE: "Contact fee required",
  WAITING_VERIFICATION: "Waiting for verification",
  CONTACT_FEE_PAID: "Contact fee paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const STATUS_OPTIONS: OrderStatus[] = ["PENDING_CONTACT_FEE", "WAITING_VERIFICATION", "CONTACT_FEE_PAID", "COMPLETED", "CANCELLED", "REJECTED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING_CONTACT_FEE: "bg-bubblegum text-ink",
  WAITING_VERIFICATION: "bg-yellow-300 text-ink",
  CONTACT_FEE_PAID: "bg-acid text-ink",
  COMPLETED: "bg-green-400 text-ink",
  CANCELLED: "bg-gray-400 text-ink",
  REJECTED: "bg-pink-400 text-ink",
};

function waitingOwner(order: {
  status: string;
  contactFeeConfirmed: boolean;
  proofUrl: string | null;
  buyerPhone: string | null;
  buyerAgreementAccepted: boolean;
  sellerOrderDetails: unknown;
  sellerMarkedReadyAt: Date | null;
  buyerConfirmedAt: Date | null;
}) {
  const details = order.sellerOrderDetails && typeof order.sellerOrderDetails === "object" && !Array.isArray(order.sellerOrderDetails)
    ? order.sellerOrderDetails as Record<string, unknown>
    : {};
  const proofSubmitted = Boolean(order.proofUrl && order.buyerPhone && order.buyerAgreementAccepted);

  if (order.status === "COMPLETED" || order.status === "CANCELLED") return "done";
  if (!order.contactFeeConfirmed) {
    if (order.status === "WAITING_VERIFICATION" && proofSubmitted) return "admin";
    return "buyer";
  }
  if (details.sellerPaymentReceived !== true || !order.sellerMarkedReadyAt) return "seller";
  if (!order.buyerConfirmedAt) return "buyer";
  return "done";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; orderId?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status;

  const orders = await prisma.order.findMany({
    where: statusFilter ? { status: statusFilter as OrderStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true, phone: true } },
      seller: { select: { name: true, email: true, sellerProfile: { select: { storeName: true, whatsappNumber: true } } } },
      listing: { include: { category: true } },
    },
  });

  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const waitingCounts = orders.reduce(
    (counts, order) => {
      const owner = waitingOwner(order);
      if (owner === "buyer") counts.buyer += 1;
      if (owner === "seller") counts.seller += 1;
      if (owner === "admin") counts.admin += 1;
      return counts;
    },
    { buyer: 0, seller: 0, admin: 0 },
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-white">Order Tracker</h1>
          <p className="text-white/70 font-bold mt-2">See the next click, the owner, and the deadline for every order.</p>
        </div>
        <Link href="/admin/contact-fees" className="bg-acid border-2 border-ink shadow-brut-md rounded-full px-4 py-2 text-xs font-black uppercase hover:bg-bubblegum">Open fee verification</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["All orders", orders.length, "bg-white"],
          ["Waiting on buyer", waitingCounts.buyer, "bg-bubblegum"],
          ["Waiting on seller", waitingCounts.seller, "bg-acid"],
          ["Needs admin", waitingCounts.admin, "bg-yellow-300"],
        ].map(([label, count, color]) => (
          <div key={String(label)} className={`${color} border-2 border-ink rounded-2xl p-4`}>
            <p className="text-[10px] uppercase font-black">{label}</p>
            <p className="text-2xl font-black mt-1">{count}</p>
          </div>
        ))}
      </div>

      {params.error === "invalid_transition" && (
        <div className="bg-red-500 text-white border-2 border-ink rounded-2xl px-5 py-3 font-black text-sm">
          Invalid status transition. That order cannot move directly to the selected status.
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        <a href="/admin/orders" className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${!statusFilter ? "bg-white text-ink" : "text-white"}`}>
          All ({orders.length})
        </a>
        {STATUS_OPTIONS.map((status) => {
          const count = statusCounts.find((item) => item.status === status)?._count._all ?? 0;
          return (
            <a key={status} href={`/admin/orders?status=${status}`} className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${statusFilter === status ? "bg-white text-ink" : "text-white"}`}>
              {ORDER_STATUS_LABELS[status]} ({count})
            </a>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center"><p className="text-gray-500 font-bold">No orders found.</p></div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const details = order.sellerOrderDetails && typeof order.sellerOrderDetails === "object" && !Array.isArray(order.sellerOrderDetails)
              ? order.sellerOrderDetails as Record<string, unknown>
              : {};
            const context = {
              orderId: order.id,
              itemTitle: order.listing?.title,
              buyerName: order.buyer?.name ?? order.buyer?.email,
              sellerName: order.seller?.name ?? order.seller?.email,
              storeName: order.seller?.sellerProfile?.storeName ?? order.seller?.name ?? undefined,
              finalPrice: order.finalPrice,
              fee: order.platformFee,
              deadline: order.itemPaymentDeadline
                ? new Date(order.itemPaymentDeadline).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                : order.paymentDeadline
                  ? new Date(order.paymentDeadline).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                  : undefined,
              buyerPhone: order.buyerPhone ?? order.buyer?.phone ?? undefined,
              sellerWhatsApp: order.seller?.sellerProfile?.whatsappNumber,
            };

            return (
              <article key={order.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 md:p-6">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black uppercase truncate">{order.listing?.category?.emoji ?? "BOX"} {order.listing?.title ?? "Unknown item"}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1 break-all">Order ID: {order.id}</p>
                    <p className="text-sm font-black mt-1">Winning bid: ₹{order.finalPrice.toLocaleString("en-IN")} · Contact fee: ₹{order.platformFee}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">Buyer: {order.buyer?.name ?? order.buyer?.email ?? "—"} · Seller: {order.seller?.sellerProfile?.storeName ?? order.seller?.name ?? order.seller?.email ?? "—"}</p>
                  </div>
                  <div className="flex flex-wrap items-start justify-end gap-2">
                    <span className={`h-fit border-2 border-ink rounded-full px-3 py-1 text-xs font-black uppercase ${STATUS_COLORS[order.status] ?? "bg-gray-300"}`}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <WhatsAppMessageButton
                      number={order.buyerPhone ?? order.buyer?.phone}
                      messages={resolveWhatsAppMessages(BUYER_TEMPLATES, context)}
                      label="Buyer chat"
                      compact
                    />
                    <WhatsAppMessageButton
                      number={order.seller?.sellerProfile?.whatsappNumber}
                      messages={resolveWhatsAppMessages(SELLER_TEMPLATES, context)}
                      label="Seller chat"
                      compact
                    />
                    <form action={updateOrderStatus} className="flex items-center gap-1">
                      <input type="hidden" name="orderId" value={order.id} />
                      <select name="status" defaultValue={order.status} className="border-2 border-ink rounded px-2 py-1 text-xs font-black">
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
                      </select>
                      <button type="submit" className="bg-ink text-white border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-acid hover:text-ink">Update</button>
                    </form>
                  </div>
                </div>

                <OrderChecklist
                  order={{
                    status: order.status,
                    proofSubmitted: Boolean(order.proofUrl && order.buyerPhone && order.buyerAgreementAccepted),
                    contactFeeConfirmed: order.contactFeeConfirmed,
                    sellerPaymentReceived: details.sellerPaymentReceived === true,
                    sellerMarkedReadyAt: order.sellerMarkedReadyAt,
                    buyerConfirmedAt: order.buyerConfirmedAt,
                    paymentDeadline: order.paymentDeadline,
                    itemPaymentDeadline: order.itemPaymentDeadline,
                    buyerPhone: order.buyerPhone ?? order.buyer?.phone ?? null,
                    sellerWhatsApp: order.seller?.sellerProfile?.whatsappNumber ?? null,
                    buyerMessages: resolveWhatsAppMessages(BUYER_TEMPLATES, context),
                    sellerMessages: resolveWhatsAppMessages(SELLER_TEMPLATES, context),
                  }}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
