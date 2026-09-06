import { prisma } from "@/lib/prisma";
import { approveContactFee, rejectContactFee } from "@/actions/auction-actions";
import WhatsAppMessageButton from "@/components/admin/WhatsAppMessageButton";
import { BUYER_TEMPLATES, resolveWhatsAppMessages, SELLER_TEMPLATES } from "@/lib/whatsapp-templates";

export const revalidate = 0;

export default async function AdminContactFeesPage() {
  const orders = await prisma.order.findMany({
    where: { status: "WAITING_VERIFICATION" },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true, phone: true } },
      seller: { select: { name: true, email: true, sellerProfile: { select: { storeName: true, whatsappNumber: true } } } },
      listing: { select: { title: true } },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase text-white">Contact Fee Verification</h1>
      <p className="text-white/70 font-bold">Check your UPI account and the WhatsApp screenshot before approving.</p>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-x-auto">
        {orders.length === 0 ? <p className="p-8 text-gray-500 font-bold">No payments waiting for verification.</p> : (
          <table className="w-full text-left">
            <thead><tr className="border-b-2 border-dashed border-ink/20">
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Order</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Buyer</th>
              <th className="pb-3 text-xs uppercase font-black text-gray-500">Item</th>
               <th className="pb-3 text-xs uppercase font-black text-gray-500">Fee / App</th>
               <th className="pb-3 text-xs uppercase font-black text-gray-500">Proof</th>
               <th className="pb-3 text-xs uppercase font-black text-gray-500">WhatsApp</th>
               <th className="pb-3 text-xs uppercase font-black text-gray-500">Actions</th>
            </tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.id} className="border-b border-ink/10">
                <td className="py-3 text-xs font-black break-all max-w-[11rem]">{order.id}</td>
                <td className="py-3 text-sm">{order.buyer.name ?? order.buyer.email}</td>
                <td className="py-3 text-sm font-black">{order.listing.title}</td>
                <td className="py-3 text-sm font-black">₹{order.platformFee}<br /><span className="text-xs uppercase text-gray-500">{order.paidVia ?? "UPI"}</span></td>
                 <td className="py-3">
                  {order.proofUrl ? (
                    <a href={order.proofUrl} target="_blank" rel="noopener noreferrer">
                      <img src={order.proofUrl} alt="Payment proof" className="w-12 h-12 rounded-lg border-2 border-ink object-cover hover:scale-110 transition-transform" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">No screenshot</span>
                   )}
                 </td>
                 <td className="py-3">
                   <div className="flex flex-wrap gap-1">
                     <WhatsAppMessageButton
                       number={order.buyerPhone ?? order.buyer.phone}
                       label="Buyer"
                       compact
                       messages={resolveWhatsAppMessages(BUYER_TEMPLATES, {
                         orderId: order.id,
                         itemTitle: order.listing.title,
                         buyerName: order.buyer.name ?? order.buyer.email,
                         storeName: order.seller.sellerProfile?.storeName ?? order.seller.name ?? undefined,
                         finalPrice: order.finalPrice,
                         fee: order.platformFee,
                         deadline: order.paymentDeadline ? new Date(order.paymentDeadline).toLocaleString("en-IN") : undefined,
                       }).filter((message) => ["buyer-submit-proof", "buyer-fee-rejected", "buyer-fee-verified"].includes(message.id))}
                     />
                     <WhatsAppMessageButton
                       number={order.seller.sellerProfile?.whatsappNumber}
                       label="Seller"
                       compact
                       messages={resolveWhatsAppMessages(SELLER_TEMPLATES, {
                         orderId: order.id,
                         itemTitle: order.listing.title,
                         sellerName: order.seller.name ?? order.seller.email,
                         storeName: order.seller.sellerProfile?.storeName ?? undefined,
                         finalPrice: order.finalPrice,
                         fee: order.platformFee,
                       }).filter((message) => message.id === "seller-fee-verified")}
                     />
                   </div>
                 </td>
                 <td className="py-3 text-right space-x-2">
                  <form action={approveContactFee} className="inline"><input type="hidden" name="orderId" value={order.id} /><button className="bg-acid border-2 border-ink px-3 py-1 rounded-full text-xs font-black">Approve</button></form>
                  <form action={rejectContactFee} className="inline"><input type="hidden" name="orderId" value={order.id} /><button className="bg-bubblegum border-2 border-ink px-3 py-1 rounded-full text-xs font-black">Reject</button></form>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
