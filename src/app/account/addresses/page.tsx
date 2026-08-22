import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAddress, setDefaultAddress, deleteAddress } from "@/actions/account-actions";

export const revalidate = 0;

export default async function AccountAddressesPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-8 text-center">
        <p className="text-gray-500 font-bold mb-4">Sign in to manage your addresses.</p>
      </div>
    );
  }

  const [addresses] = await Promise.all([
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: { isDefault: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase">Saved Addresses</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-6">
          <h2 className="text-xl font-black uppercase mb-4">Add New Address</h2>
          <form action={createAddress} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">Label</label>
              <input name="label" type="text" required placeholder="Home / Work" className="w-full bg-white border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">Line 1</label>
              <input name="line1" type="text" required className="w-full bg-white border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">Line 2</label>
              <input name="line2" type="text" placeholder="Apartment, floor, etc." className="w-full bg-white border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">City</label>
                <input name="city" type="text" required className="w-full bg-white border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">State</label>
                <input name="state" type="text" required className="w-full bg-white border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">Pincode</label>
                <input name="pincode" type="text" required className="w-full bg-white border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">Country</label>
                <input name="country" type="text" defaultValue="India" className="w-full bg-white border-2 border-ink rounded-xl px-4 py-2 font-bold text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-ink text-white border-2 border-ink py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors">
              Save Address
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <p className="text-gray-500 font-bold uppercase">No addresses yet.</p>
          ) : (
            addresses.map((a) => (
              <div key={a.id} className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black uppercase">{a.label}</p>
                    <p className="text-sm font-bold text-gray-600 mt-1">
                      {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                    </p>
                    <p className="text-xs font-black text-gray-500">{a.country}</p>
                    {a.isDefault && <span className="text-xs font-black text-acid mt-1 block">✓ Default</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!a.isDefault && (
                      <form action={setDefaultAddress}>
                        <input type="hidden" name="addressId" value={a.id} />
                        <button className="text-xs font-black border-2 border-ink px-2 py-1 rounded hover:bg-acid">
                          Set Default
                        </button>
                      </form>
                    )}
                    <form action={deleteAddress}>
                      <input type="hidden" name="addressId" value={a.id} />
                      <button className="text-xs font-black bg-ink text-white border-2 border-ink px-2 py-1 rounded hover:bg-bubblegum hover:text-ink">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
