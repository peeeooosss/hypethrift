import CountdownTimer from "@/components/ui/CountdownTimer";
import WhatsAppMessageButton from "@/components/admin/WhatsAppMessageButton";
import type { WhatsAppMessage } from "@/lib/whatsapp-templates";

export type OrderChecklistData = {
  status: string;
  proofSubmitted: boolean;
  contactFeeConfirmed: boolean;
  sellerPaymentReceived: boolean;
  sellerMarkedReadyAt: Date | null;
  buyerConfirmedAt: Date | null;
  paymentDeadline: Date | null;
  itemPaymentDeadline: Date | null;
  buyerPhone: string | null;
  sellerWhatsApp: string | null;
  buyerMessages: WhatsAppMessage[];
  sellerMessages: WhatsAppMessage[];
};

function dateLabel(date: Date | null) {
  return date ? new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null;
}

function message(messages: WhatsAppMessage[], id: string) {
  return messages.filter((item) => item.id === id);
}

export default function OrderChecklist({ order }: { order: OrderChecklistData }) {
  const terminal = order.status === "COMPLETED" || order.status === "CANCELLED";
  const feeSubmitted = order.proofSubmitted;

  let blocker: { owner: "Buyer" | "Seller" | "Admin"; action: string; number?: string | null; messages?: WhatsAppMessage[] } | null = null;
  if (!terminal && !order.contactFeeConfirmed) {
    if (order.status === "REJECTED") {
      blocker = {
        owner: "Buyer",
        action: "Resubmit the contact-fee proof",
        number: order.buyerPhone,
        messages: message(order.buyerMessages, "buyer-fee-rejected"),
      };
    } else if (order.status === "WAITING_VERIFICATION" && feeSubmitted) {
      blocker = { owner: "Admin", action: "Verify the contact fee" };
    } else if (!feeSubmitted) {
      blocker = {
        owner: "Buyer",
        action: "Pay the contact fee and submit proof",
        number: order.buyerPhone,
        messages: message(order.buyerMessages, order.status === "WAITING_VERIFICATION" ? "buyer-submit-proof" : "buyer-pay-fee"),
      };
    } else {
      blocker = { owner: "Admin", action: "Verify the contact fee" };
    }
  } else if (!terminal && !order.sellerPaymentReceived) {
    blocker = {
      owner: "Seller",
      action: "Confirm the buyer paid the item price",
      number: order.sellerWhatsApp,
      messages: message(order.sellerMessages, "seller-confirm-item-payment"),
    };
  } else if (!terminal && !order.sellerMarkedReadyAt) {
    blocker = {
      owner: "Seller",
      action: "Mark the handoff ready",
      number: order.sellerWhatsApp,
      messages: message(order.sellerMessages, "seller-mark-handoff"),
    };
  } else if (!terminal && !order.buyerConfirmedAt) {
    blocker = {
      owner: "Buyer",
      action: "Confirm receipt of the item",
      number: order.buyerPhone,
      messages: message(order.buyerMessages, "buyer-confirm-receipt"),
    };
  }

  const steps = [
    {
      label: "Buyer submitted payment proof and details",
      done: feeSubmitted,
      active: !terminal,
      owner: feeSubmitted ? null : "Buyer",
      timestamp: null,
      number: order.buyerPhone,
      messages: message(order.buyerMessages, "buyer-submit-proof"),
    },
    {
      label: "Admin verified the contact fee",
      done: order.contactFeeConfirmed,
      active: feeSubmitted || order.contactFeeConfirmed || order.status === "REJECTED",
      owner: order.contactFeeConfirmed ? null : order.status === "WAITING_VERIFICATION" ? "Admin" : "Buyer",
      timestamp: null,
      number: order.buyerPhone,
      messages: message(order.buyerMessages, order.status === "REJECTED" ? "buyer-fee-rejected" : "buyer-pay-fee"),
    },
    {
      label: "Seller confirmed item payment",
      done: order.sellerPaymentReceived,
      active: order.contactFeeConfirmed,
      owner: order.sellerPaymentReceived ? null : "Seller",
      timestamp: null,
      number: order.sellerWhatsApp,
      messages: message(order.sellerMessages, "seller-confirm-item-payment"),
    },
    {
      label: "Seller marked handoff ready",
      done: Boolean(order.sellerMarkedReadyAt),
      active: order.contactFeeConfirmed && order.sellerPaymentReceived,
      owner: order.sellerMarkedReadyAt ? null : "Seller",
      timestamp: order.sellerMarkedReadyAt,
      number: order.sellerWhatsApp,
      messages: message(order.sellerMessages, "seller-mark-handoff"),
    },
    {
      label: "Buyer confirmed receipt",
      done: Boolean(order.buyerConfirmedAt),
      active: Boolean(order.sellerMarkedReadyAt),
      owner: order.buyerConfirmedAt ? null : "Buyer",
      timestamp: order.buyerConfirmedAt,
      number: order.buyerPhone,
      messages: message(order.buyerMessages, "buyer-confirm-receipt"),
    },
  ] as const;

  return (
    <div className="mt-5 border-t-2 border-dashed border-ink/20 pt-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase">Transaction checklist</h2>
          <p className="text-xs text-gray-500 font-bold mt-1">See exactly who must click next.</p>
        </div>
        {blocker ? (
          <div className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${blocker.owner === "Admin" ? "bg-yellow-200 border-yellow-500" : "bg-bubblegum/30 border-bubblegum"}`}>
            Waiting on {blocker.owner}: {blocker.action}
            {blocker.owner !== "Admin" && blocker.number && blocker.messages && (
              <span className="ml-2 inline-block">
                <WhatsAppMessageButton number={blocker.number} messages={blocker.messages} label="Remind" compact />
              </span>
            )}
          </div>
        ) : (
          <span className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${terminal ? "bg-acid border-acid" : "bg-gray-100 border-ink/20"}`}>
            {terminal ? "No pending action" : "Ready for next review"}
          </span>
        )}
      </div>

      {order.paymentDeadline && !order.contactFeeConfirmed && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-yellow-100 border-2 border-yellow-500 rounded-xl p-3">
          <span className="text-xs font-black uppercase">Contact-fee deadline</span>
          <CountdownTimer deadline={order.paymentDeadline} compact />
        </div>
      )}
      {order.itemPaymentDeadline && order.contactFeeConfirmed && !order.buyerConfirmedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-bubblegum/20 border-2 border-bubblegum rounded-xl p-3">
          <span className="text-xs font-black uppercase">Item-payment deadline</span>
          <CountdownTimer deadline={order.itemPaymentDeadline} compact />
        </div>
      )}

      <div className="grid gap-2">
        {steps.map((step) => (
          <div key={step.label} className={`flex flex-wrap items-center gap-3 rounded-xl border-2 px-3 py-3 ${step.done ? "border-acid bg-acid/20" : step.active ? "border-ink/15 bg-ink/5" : "border-ink/10 bg-gray-50 opacity-60"}`}>
            <span className={`w-6 h-6 rounded-full border-2 border-ink flex items-center justify-center text-xs font-black ${step.done ? "bg-acid" : "bg-white"}`}>
              {step.done ? "OK" : "--"}
            </span>
            <div className="min-w-[13rem] flex-1">
              <p className="text-xs font-black uppercase">{step.label}</p>
              {step.done && <p className="text-[11px] text-gray-500 font-bold mt-1">{step.timestamp ? `Clicked ${dateLabel(step.timestamp)}` : "Recorded"}</p>}
              {!step.done && step.active && step.owner && <p className="text-[11px] text-gray-500 font-bold mt-1">Waiting on {step.owner}</p>}
              {!step.done && !step.active && <p className="text-[11px] text-gray-500 font-bold mt-1">Available after the previous step</p>}
            </div>
            {!step.done && step.active && step.owner !== "Admin" && step.number && step.messages && (
              <WhatsAppMessageButton number={step.number} messages={step.messages} label="Remind" compact />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
