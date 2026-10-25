import { prisma } from "@/lib/prisma";
import { updateTicketStatus, deleteSupportTicket } from "@/actions/admin-actions";

const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-bubblegum text-ink",
  IN_PROGRESS: "bg-blue-400 text-ink",
  RESOLVED: "bg-acid text-ink",
  CLOSED: "bg-gray-400 text-ink",
};

type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const statusFilter = (await searchParams).status;

  const tickets = await prisma.supportTicket.findMany({
    where: statusFilter ? { status: statusFilter as SupportTicketStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  const statusCounts = await prisma.supportTicket.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase text-white">Support Tickets</h1>

      <div className="flex gap-2 overflow-x-auto">
        <a
          href="/admin/support"
          className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${
            !statusFilter ? "bg-white text-ink" : "bg-transparent text-white"
          }`}
        >
          All ({tickets.length})
        </a>
          {STATUS_OPTIONS.map((s) => {
          const count = statusCounts?.find((sc) => sc.status === s)?._count._all ?? 0;
          return (
            <a
              key={s}
              href={`/admin/support?status=${s}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-white font-black uppercase text-xs hover:bg-white hover:text-ink transition-colors ${
                statusFilter === s ? "bg-white text-ink" : "bg-transparent text-white"
              }`}
            >
              {TICKET_STATUS_LABELS[s]} ({count})
            </a>
          );
        })}
      </div>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-2xl overflow-x-auto">
        {tickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 font-bold">No tickets found.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-ink/20">
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Subject</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">User</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Message</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Status</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500">Created</th>
                <th className="pb-3 text-xs uppercase font-black text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-ink/10">
                  <td className="py-3 font-black">{t.subject}</td>
                  <td className="py-3 text-sm">{t.user?.name ?? t.user?.email ?? "—"}</td>
                  <td className="py-3 text-sm text-gray-600 line-clamp-2 max-w-xs">{t.message}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-xl text-xs font-black ${
                        STATUS_COLORS[t.status] ?? "bg-gray-300"
                      }`}
                    >
                      {TICKET_STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 text-right space-x-1">
                    <form action={updateTicketStatus} className="inline-flex items-center gap-1">
                      <input type="hidden" name="ticketId" value={t.id} />
                      <select
                        name="status"
                        defaultValue={t.status}
                        className="border-2 border-ink rounded px-2 py-1 text-xs font-black"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-ink text-white border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-acid hover:text-ink"
                      >
                        Update
                      </button>
                    </form>
                    {" "}
                    <form action={deleteSupportTicket} className="inline">
                      <input type="hidden" name="ticketId" value={t.id} />
                      <button
                        type="submit"
                        className="bg-bubblegum border-2 border-ink px-2 py-1 rounded text-xs font-black hover:bg-acid hover:text-ink"
                      >
                        ✕
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
