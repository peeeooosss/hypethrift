import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitContactFee } from "@/actions/auction-actions";
import { BUYER_AGREEMENT } from "@/data/agreements";
import { CONTACT_FEE, upiLinks } from "@/lib/platform";
import AgreementSections from "@/components/legal/AgreementSections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactWinnerPage({ params, searchParams }: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { listingId: rawListingId } = await params;
  const listingId = decodeURIComponent(rawListingId);
  const { error } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { category: true },
  });
  if (!listing) notFound();

  const winningBid = await prisma.bid.findFirst({
    where: { listingId },
    orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
  });
  if (!winningBid || winningBid.bidderId !== session.user.id) redirect("/account/bids");

  let order = await prisma.order.findUnique({ where: { listingId } });
  if (!order) {
    if (new Date(listing.endsAt) > new Date()) redirect("/account/bids");
    order = await prisma.order.create({
      data: {
        listingId,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        finalPrice: winningBid.amount,
        platformFee: CONTACT_FEE,
        paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "PENDING_CONTACT_FEE",
      },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { status: "SOLD" } });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });
  const links = upiLinks(CONTACT_FEE, `HypeThrift contact fee ${order.id}`);
  const alreadySubmitted = order.status === "WAITING_VERIFICATION";
  const approved = order.contactFeeConfirmed && (order.status === "CONTACT_FEE_PAID" || order.status === "COMPLETED");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/account/bids" className="text-sm font-black underline">← Back to My Bids</Link>
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase font-black text-bubblegum tracking-widest">Winning bid</p>
        <h1 className="text-3xl font-black uppercase mt-1">Contact seller</h1>
        <div className="mt-5 bg-ink/5 border-2 border-ink/20 rounded-2xl p-4">
          <p className="font-black uppercase">{listing.category.emoji} {listing.title}</p>
          <p className="text-sm text-gray-500 font-bold mt-1">Order ID: {order.id}</p>
          <p className="text-sm text-gray-500 font-bold">Winning bid: ₹{winningBid.amount.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {approved ? (
        <div className="bg-acid border-2 border-ink shadow-brut-lg rounded-3xl p-6 text-center">
          <h2 className="text-2xl font-black uppercase">Payment verified</h2>
          <p className="font-bold mt-2">Seller details are unlocked. Send the order details to the seller.</p>
          <Link href={`/account/orders/${order.id}`} className="inline-block mt-5 bg-ink text-white border-2 border-ink px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-bubblegum hover:text-ink">View order</Link>
        </div>
      ) : alreadySubmitted ? (
        <div className="bg-bubblegum border-2 border-ink shadow-brut-lg rounded-3xl p-6 text-center">
          <h2 className="text-2xl font-black uppercase">Waiting for verification</h2>
          <p className="font-bold mt-2">We are checking your ₹69 payment screenshot on WhatsApp.</p>
          <Link href={`/account/orders/${order.id}`} className="inline-block mt-5 bg-ink text-white border-2 border-ink px-6 py-3 rounded-2xl font-black uppercase text-sm">View order status</Link>
        </div>
      ) : (
        <form action={submitContactFee} className="space-y-8">
          <input type="hidden" name="orderId" value={order.id} />
          {error && <p className="text-red-500 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-xl p-3">Please complete the highlighted details before continuing.</p>}

          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
            <AgreementSections sections={BUYER_AGREEMENT} heading="Buyer agreement" fullHref="/agreements/buyer" />
            <label className="flex items-start gap-3 mt-5 text-sm font-bold">
              <input type="checkbox" name="agreement" required className="mt-1" />
              <span>I have read and accept the Buyer Agreement for this winning bid.</span>
            </label>
          </div>

          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
            <h2 className="text-xl font-black uppercase mb-4">Your order details</h2>
            <div className="mb-4">
              <label className="block text-xs uppercase font-black text-gray-500 mb-1">Phone number</label>
              <input name="phone" required inputMode="tel" className="w-full border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" placeholder="Your WhatsApp number" />
            </div>
            {addresses.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs uppercase font-black text-gray-500 mb-1">Saved address</label>
                <select name="addressId" defaultValue={addresses.find((address) => address.isDefault)?.id ?? ""} className="w-full border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm">
                  <option value="">Enter a new address below</option>
                  {addresses.map((address) => <option key={address.id} value={address.id}>{address.label}: {address.line1}, {address.city}</option>)}
                </select>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <input name="label" placeholder="Address label" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="line1" placeholder="Address line 1" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="line2" placeholder="Address line 2 (optional)" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="city" placeholder="City" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="state" placeholder="State" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="pincode" placeholder="Pincode" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            </div>
          </div>

          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
            <h2 className="text-xl font-black uppercase">Pay connection fee: ₹{CONTACT_FEE}</h2>
            <p className="text-sm text-gray-500 font-bold mt-1">Pay HypeThrift UPI <span className="text-ink">9864854481@ptsbi</span>, not the seller. The item payment is arranged directly with the seller after connection.</p>
            <div className="grid grid-cols-3 gap-2 mt-5">
              <a href={links.paytm} className="text-center bg-white border-2 border-ink rounded-xl py-3 font-black uppercase text-xs hover:bg-acid">Paytm</a>
              <a href={links.phonepe} className="text-center bg-white border-2 border-ink rounded-xl py-3 font-black uppercase text-xs hover:bg-acid">PhonePe</a>
              <a href={links.googlePay} className="text-center bg-white border-2 border-ink rounded-xl py-3 font-black uppercase text-xs hover:bg-acid">Google Pay</a>
            </div>
            <select name="paidVia" required defaultValue="" className="w-full mt-4 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm">
              <option value="">Select the app you used</option>
              <option value="Paytm">Paytm</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Google Pay">Google Pay</option>
            </select>
            <button className="w-full mt-4 bg-bubblegum border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase text-lg hover:bg-acid transition-colors">I Have Paid — Send Screenshot</button>
            <p className="text-xs text-gray-500 font-bold mt-3">You will be redirected to WhatsApp. Send your payment screenshot there, then return to this page to see the verification status.</p>
          </div>
        </form>
      )}
    </div>
  );
}
