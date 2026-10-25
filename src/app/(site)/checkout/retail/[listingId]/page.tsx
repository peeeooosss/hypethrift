import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitRetailPayment } from "@/actions/retail-actions";
import { ADMIN_UPI_ID, RETAIL_CONNECTION_FEE, upiLinks } from "@/lib/platform";
import ProofUpload from "@/components/ui/ProofUpload";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RetailCheckoutPage(props: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { listingId: raw } = await props.params;
  const { error } = await props.searchParams;
  const listingId = decodeURIComponent(raw);
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect(session.user.role === "SELLER" ? "/seller" : "/admin");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { category: true },
  });
  if (!listing) notFound();
  if (listing.status !== "ACTIVE") redirect(`/listing/${encodeURIComponent(listingId)}`);
  if (listing.sellerId === session.user.id) redirect(`/listing/${encodeURIComponent(listingId)}`);
  if (!["RETAIL", "BOTH"].includes(listing.listingMode) || listing.buyNowPrice == null) {
    redirect(`/listing/${encodeURIComponent(listingId)}`);
  }

  const existing = await prisma.retailOrder.findUnique({ where: { listingId } });
  if (existing && existing.status !== "CANCELLED") redirect("/account/retail-orders");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });
  const total = listing.buyNowPrice + RETAIL_CONNECTION_FEE;
  const links = upiLinks(total, `HypeThrift Buy Now ${listing.id}`);

  return (
    <div className="min-h-screen bg-cream text-ink py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <Link href={`/listing/${encodeURIComponent(listing.id)}`} className="text-sm font-black underline">
          ← Back to item
        </Link>

        <div className="bg-ink text-cream border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <p className="text-xs uppercase font-black text-acid tracking-widest mb-1">Buy Now checkout</p>
          <h1 className="text-2xl md:text-3xl font-black uppercase">
            {listing.category.emoji} {listing.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-black text-lg">
              Item <span className="text-acid">₹{listing.buyNowPrice.toLocaleString("en-IN")}</span>
              <span className="text-cream/70 text-sm font-bold"> + ₹{RETAIL_CONNECTION_FEE} handling fee </span>
            </p>
            <p className="text-2xl font-black text-bubblegum">Total: ₹{total.toLocaleString("en-IN")}</p>
          </div>
          {listing.size && (
            <p className="mt-2 text-xs font-black uppercase bg-cream/10 border border-cream/30 rounded-full inline-block px-3 py-1">
              Size {listing.size}
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm font-bold bg-red-50 border-2 border-red-300 rounded-2xl p-4">
            Please complete all required details below before continuing.
          </p>
        )}

        <form action={submitRetailPayment} className="space-y-6">
          <input type="hidden" name="listingId" value={listing.id} />

          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
            <h2 className="text-xl font-black uppercase mb-4">Delivery details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="fullName" required placeholder="Receiver's full name" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="phone" required inputMode="tel" placeholder="Receiver's WhatsApp / phone number" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            </div>
            {addresses.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs uppercase font-black text-gray-500 mb-1">Saved address</label>
                <select name="addressId" defaultValue={addresses.find((a) => a.isDefault)?.id ?? ""} className="w-full border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm">
                  <option value="">Enter a new address below</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}: {a.line1}, {a.city}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <input name="label" placeholder="Address label (optional)" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="line1" placeholder="Address line 1 *" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="line2" placeholder="Address line 2 (optional)" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="city" placeholder="City *" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="state" placeholder="State *" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
              <input name="pincode" placeholder="Pincode *" className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm" />
            </div>
          </div>

          <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
            <h2 className="text-xl font-black uppercase">Pay ₹{total.toLocaleString("en-IN")} to HypeThrift</h2>
            <p className="text-sm text-gray-500 font-bold mt-1">
              Pay our UPI <span className="text-ink">{ADMIN_UPI_ID}</span>. We hold the payment and only release it to the seller
              after you confirm delivery — you are fully protected.
            </p>
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
            <div className="mt-4 p-4 bg-ink/5 border-2 border-ink/20 rounded-xl">
              <ProofUpload onUploadComplete={() => {}} helperText="Upload a screenshot of your payment (optional but recommended)" />
            </div>
            <button className="w-full mt-4 bg-bubblegum border-2 border-ink shadow-brut-md py-4 rounded-2xl font-black uppercase text-lg hover:bg-acid transition-colors">
              I Have Paid — Send Screenshot
            </button>
            <p className="text-xs text-gray-500 font-bold mt-3">
              You will be redirected to WhatsApp where you can send the screenshot to our team for verification.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}