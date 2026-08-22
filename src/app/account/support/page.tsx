import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupportTicket, getSupportTickets } from "@/actions/account-actions";

export const revalidate = 0;

const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tickets = await getSupportTickets();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase">Support Tickets</h1>
        <Link
          href="/account/support/new"
          className="bg-ink text-white border-2 border-ink shadow-brut-md px-5 py-3 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
        >
          + New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8 text-center">
          <p className="text-gray-500 font-bold mb-4">No support tickets yet.</p>
          <p className="text-sm text-gray-500 font-bold">
            Need help?{" "}
            <Link href="/account/support/new" className="underline font-black">
              Open a new ticket
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/account/support/${t.id}`}
              className="block bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-5 hover:bg-ink/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black uppercase line-clamp-1">{t.subject}</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={`inline-block px-2 py-1 rounded-xl text-xs font-black ${
                    t.status === "OPEN"
                      ? "bg-bubblegum text-ink"
                      : t.status === "IN_PROGRESS"
                      ? "bg-blue-400 text-ink"
                      : t.status === "RESOLVED"
                      ? "bg-acid text-ink"
                      : "bg-gray-400 text-ink"
                  }`}
                >
                  {TICKET_STATUS_LABELS[t.status] ?? t.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
