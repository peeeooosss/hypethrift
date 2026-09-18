"use client";

import { useState } from "react";
import { markRetailDelivered, packRetailOrder, shipRetailOrder } from "@/actions/retail-actions";
import { RETAIL_ORDER_STATUS_LABEL, type RetailOrderStatus } from "@/types/retail";
import { formatAddress, whatsappUrl } from "@/lib/platform";

export type SellerRetailRow = {
  id: string;
  status: RetailOrderStatus;
  finalPrice: number;
  connectionFee: number;
  total: number;
  addressVisible: boolean;
  buyerName: string | null;
  buyerPhone: string | null;
  address: unknown;
  trackingNumber: string | null;
  trackingUrl: string | null;
  paymentMethod: string | null;
  adminVerifiedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  buyerConfirmedAt: Date | null;
  completedAt: Date | null;
  adminNotes: string | null;
  createdAt: Date;
  listing: { id: string; title: string; images: string[]; size: string | null };
};

const FLOW: RetailOrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_VERIFIED", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"];

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function RetailSellerOrderCard({ order }: { order: SellerRetailRow }) {
  const [showTracking, setShowTracking] = useState(false);
  const idx = FLOW.indexOf(order.status);
  const cancelled = order.status === "CANCELLED";
  const canFulfill = ["PAYMENT_VERIFIED", "PACKED", "SHIPPED"].includes(order.status);

  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          {order.listing.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.listing.images[0]} alt={order.listing.title} className="w-20 h-20 rounded-2xl border-2 border-ink object-cover" />
          )}
          <div>
            <p className="font-black uppercase">{order.listing.title}</p>
            <p className="text-sm font-bold text-gray-500">
              Order #{order.id.slice(-8)} · {order.listing.size ?? "One Size"}
            </p>
            <p className="text-sm font-bold text-gray-500">
              Buyer: {order.buyerName ?? "Buyer"} {order.addressVisible && order.buyerPhone ? `· ${order.buyerPhone}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-acid">{money(order.total)}</p>
          <p className="text-[11px] font-black uppercase text-gray-500">You get {money(order.finalPrice)} · ₹{order.connectionFee} fee</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-black uppercase text-gray-500 mb-2">Status</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {FLOW.map((s, stepIdx) => (
            <span
              key={s}
              className={`text-[10px] font-black uppercase rounded-full px-3 py-1 border-2 ${
                stepIdx < idx ? "bg-acid/40 border-acid text-ink" : stepIdx === idx ? "bg-ink text-white border-ink" : "bg-ink/5 border-ink/20 text-gray-400"
              }`}
            >
              {RETAIL_ORDER_STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      {cancelled ? (
        <div className="mt-4 bg-gray-100 border-2 border-ink rounded-2xl p-4">
          <p className="font-black uppercase text-sm">Order cancelled</p>
          <p className="text-xs font-bold text-gray-600 mt-1">{order.adminNotes ?? "Cancelled by support."}</p>
        </div>
      ) : (
        <>
          {/* Address is only visible once payment is verified */}
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Delivery address</p>
              {order.addressVisible ? (
                <p className="text-sm font-bold leading-relaxed">{formatAddress(order.address)}</p>
              ) : (
                <p className="text-sm font-bold text-gray-500">
                  Released after HypeThrift verifies the buyer&apos;s payment.
                </p>
              )}
            </div>
            <div className="bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Buyer contact</p>
              {order.addressVisible && order.buyerPhone ? (
                <>
                  <p className="text-sm font-bold break-all">{order.buyerPhone}</p>
                  <a
                    href={whatsappUrl(order.buyerPhone, `Hi ${order.buyerName ?? "there"}, this is ${order.listing.title} — your HypeThrift Buy Now order #${order.id.slice(-8)}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs font-black uppercase bg-ink text-white border-2 border-ink px-3 py-1.5 rounded-full hover:bg-acid hover:text-ink"
                  >
                    💬 Chat on WhatsApp
                  </a>
                </>
              ) : (
                <p className="text-sm font-bold text-gray-500">Buyer phone is shared after payment verification.</p>
              )}
            </div>
          </div>

          {canFulfill && (
            <div className="mt-4 border-t-2 border-dashed border-ink/20 pt-4">
              {order.status === "PAYMENT_VERIFIED" && (
                <p className="text-xs font-bold text-gray-500 mb-3">
                  Payment verified · pack the item, then ship with a tracking number.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {order.status === "PAYMENT_VERIFIED" && (
                  <form action={packRetailOrder}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="bg-acid border-2 border-ink shadow-brut-sm px-4 py-2 rounded-xl font-black uppercase text-xs hover:bg-bubblegum transition-colors">
                      ✓ Packed them
                    </button>
                  </form>
                )}
                {(order.status === "PAYMENT_VERIFIED" || order.status === "PACKED") && (
                  <button
                    onClick={() => setShowTracking((v) => !v)}
                    className="bg-white border-2 border-ink shadow-brut-sm px-4 py-2 rounded-xl font-black uppercase text-xs hover:bg-ink hover:text-white transition-colors"
                  >
                    📦 Add tracking
                  </button>
                )}
                {order.status === "SHIPPED" && (
                  <form action={markRetailDelivered}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="bg-acid border-2 border-ink shadow-brut-sm px-4 py-2 rounded-xl font-black uppercase text-xs hover:bg-bubblegum transition-colors">
                      🚚 Mark delivered
                    </button>
                  </form>
                )}
              </div>

              {showTracking && (
                <form action={shipRetailOrder} className="mt-3 grid md:grid-cols-2 gap-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input name="trackingNumber" required placeholder="Tracking / AWB number" className="border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
                  <div className="flex gap-2">
                    <input name="trackingUrl" placeholder="Tracking URL (optional)" className="flex-1 border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
                    <button className="bg-ink text-white border-2 border-ink px-4 py-2 rounded-xl font-black uppercase text-xs hover:bg-acid hover:text-ink">Ship</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {order.status === "DELIVERED" && (
            <p className="mt-4 text-sm font-bold text-gray-600 bg-bubblegum/10 border-2 border-bubblegum/40 rounded-2xl p-4">
              Waiting for the buyer to confirm delivery. Your payout is triggered once they do.
            </p>
          )}
          {order.status === "COMPLETED" && (
            <p className="mt-4 text-sm font-black text-acid bg-acid/10 border-2 border-acid/50 rounded-2xl p-4">
              Completed · buyer confirmed delivery. ₹{order.connectionFee} fee collected by HypeThrift.
            </p>
          )}
        </>
      )}
    </div>
  );
}