import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sellerLoginAction } from "@/actions/auth-actions";
import { sellerRegisterAction } from "@/actions/auth-actions";
import { SELLER_AGREEMENT } from "@/data/agreements";
import AgreementSections from "@/components/legal/AgreementSections";

async function loginAction(formData: FormData) {
  await sellerLoginAction(null, formData);
}

async function registerAction(formData: FormData) {
  await sellerRegisterAction(null, formData);
}

export default async function SellerPortalPage() {
  const session = await auth();

  if (session?.user?.role === "SELLER") {
    const status = session.user.sellerStatus;
    if (status === "APPROVED") {
      return <SellerDashboard userId={session.user.id} />;
    }
    if (status === "PENDING" || status === "REJECTED") {
      redirect("/seller/verification");
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-6xl bg-white border-2 border-ink shadow-brut-2xl rounded-3xl p-8 md:p-12">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-black uppercase tracking-tighter">HypeThrift</Link>
          <h1 className="text-4xl font-black uppercase mt-4">Seller Portal</h1>
          <p className="text-lg text-gray-500 font-bold mt-2">
            {session?.user?.role === "SELLER" ? "Welcome back" : "Join as a seller or sign in to manage your store"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Section */}
          <div className="bg-ink/5 border-2 border-ink/20 rounded-3xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black uppercase">Welcome Back</h2>
              <p className="text-gray-500 font-bold mt-1">Sign in to access your seller dashboard</p>
            </div>

            <form action={loginAction} className="space-y-5">
              <div>
                <label className="text-xs uppercase font-black text-gray-500 tracking-widest">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                  placeholder="seller@example.com"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-black text-gray-500 tracking-widest">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-ink text-white border-2 border-ink shadow-brut-lg py-4 rounded-2xl font-black uppercase text-lg hover:bg-acid hover:text-ink transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>

          {/* Onboarding Section */}
          <div className="bg-bubblegum/10 border-2 border-bubblegum/30 rounded-3xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black uppercase">New Seller?</h2>
              <p className="text-gray-600 font-bold mt-1">Create your store and start selling today</p>
            </div>

            <form action={registerAction} className="space-y-5">
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 tracking-widest">Your Name</label>
                <input
                  name="name"
                  required
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 tracking-widest">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                  placeholder="seller@example.com"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 tracking-widest">Password</label>
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 tracking-widest">Store Name</label>
                <input
                  name="storeName"
                  required
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                  placeholder="e.g. Archive Room"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 tracking-widest">WhatsApp Number</label>
                <input
                  name="whatsappNumber"
                  required
                  inputMode="tel"
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                  placeholder="10-digit number"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  name="location"
                  placeholder="City, State"
                  className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                />
                <input
                  name="returnPolicy"
                  placeholder="Return policy"
                  className="border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
                />
              </div>
              <textarea
                name="storeDescription"
                rows={3}
                placeholder="Tell buyers what you sell..."
                className="w-full border-2 border-ink rounded-xl px-4 py-3 font-bold text-sm"
              />
              <AgreementSections sections={SELLER_AGREEMENT} heading="Seller agreement" fullHref="/agreements/seller" />
              <label className="flex items-start gap-3 text-sm font-bold text-gray-700">
                <input type="checkbox" name="agreementAccepted" required className="mt-1" />
                <span>I have read and accept the Seller Agreement.</span>
              </label>
              <button
                type="submit"
                className="w-full bg-bubblegum text-ink border-2 border-ink shadow-brut-lg py-4 rounded-2xl font-black uppercase text-lg hover:bg-acid hover:text-ink transition-colors"
              >
                Create Seller Account
              </button>
            </form>

            <p className="text-center text-sm font-bold text-gray-600 mt-4">
              Admin approval required before listing. You&apos;ll be notified once approved.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

async function SellerDashboard({ userId }: { userId: string }) {
  const [listings, totalBids, recentOrders] = await Promise.all([
    prisma.listing.findMany({ where: { sellerId: userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.bid.count({ where: { listing: { sellerId: userId } } }),
    prisma.order.findMany({ where: { sellerId: userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Listings", value: listings.length },
    { label: "Total Bids", value: totalBids },
    { label: "Orders", value: recentOrders.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase">Seller Dashboard</h1>
        <Link
          href="/seller/listings/new"
          className="bg-ink text-white px-4 py-2 rounded-full text-xs font-black uppercase border-2 border-ink hover:bg-acid hover:text-ink transition-colors"
        >
          + New Drop
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border-2 border-ink shadow-brut-md rounded-2xl p-5">
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
        <h2 className="text-xl font-black uppercase mb-4">Recent Listings</h2>
        {listings.length === 0 ? (
          <p className="text-gray-500 font-bold">No listings yet. Create your first drop!</p>
        ) : (
          <ul className="divide-y-2 divide-dashed divide-ink/20">
            {listings.map((l) => (
              <li key={l.id} className="py-3 flex justify-between items-center">
                <span className="font-black">{l.title}</span>
                <span className="text-xs font-bold uppercase text-gray-500">{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}