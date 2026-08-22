import { prisma } from "@/lib/prisma";
import { changeUserRole, banUser, unbanUser } from "@/actions/admin-actions";

const ROLES = ["CUSTOMER", "SELLER", "ADMIN"];

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl p-6">
      <h1 className="text-2xl font-black uppercase mb-4">Users ({users.length})</h1>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-dashed border-ink/20">
            <th className="pb-2 text-xs uppercase font-black text-gray-500">Name</th>
            <th className="pb-2 text-xs uppercase font-black text-gray-500">Email</th>
            <th className="pb-2 text-xs uppercase font-black text-gray-500">Role</th>
            <th className="pb-2 text-xs uppercase font-black text-gray-500">Status</th>
            <th className="pb-2 text-xs uppercase font-black text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-ink/10">
              <td className="py-3 font-black">{u.name ?? "—"}</td>
              <td className="py-3 text-sm">{u.email}</td>
              <td className="py-3 text-xs">
                <form action={changeUserRole} className="flex items-center gap-1">
                  <input type="hidden" name="userId" value={u.id} />
                  <select name="role" defaultValue={u.role} className="border-2 border-ink rounded px-2 py-1 text-xs font-black">
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                  <button className="bg-ink text-white px-2 py-1 rounded text-xs font-black">Set</button>
                </form>
              </td>
              <td className="py-3 text-xs">
                {u.isBanned ? (
                  <span className="text-bubblegum font-black">Banned</span>
                ) : u.sellerStatus ? (
                  <span className="text-acid font-black">Seller • {u.sellerStatus}</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-3 text-right space-x-1">
                {u.isBanned ? (
                  <form action={unbanUser} className="inline">
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="bg-acid border-2 border-ink px-2 py-1 rounded text-xs font-black">Unban</button>
                  </form>
                ) : (
                  <form action={banUser} className="inline">
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="bg-bubblegum border-2 border-ink px-2 py-1 rounded text-xs font-black">Ban</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
