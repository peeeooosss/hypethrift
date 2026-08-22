import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getSupportTicket } from "@/actions/account-actions";

function formatDate(d: Date) {
  return new Date(d).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-bubblegum text-ink",
  IN_PROGRESS: "bg-blue-400 text-ink",
  RESOLVED: "bg-acid text-ink",
  CLOSED: "bg-gray-400 text-ink",
};

export const revalidate = 0;

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const ticket = await getSupportTicket(ticketId);
  if (!ticket) notFound();

  return (
    <div className="space-y-8">
      <Link href="/account/support" className="text-sm font-black text-gray-500 hover:text-ink">
        ← Back to Support
      </Link>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black uppercase">{ticket.subject}</h1>
          <span
            className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
              STATUS_COLORS[ticket.status] ?? "bg-gray-300"
            }`}
          >
            {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
        </div>

        <div className="border-2 border-ink/20 rounded-xl p-4 mb-4">
          <p className="text-xs uppercase font-black text-gray-500 mb-2">
            Created: {formatDate(ticket.createdAt)}
          </p>
          <p className="text-xs uppercase font-black text-gray-500">
            Last updated: {formatDate(ticket.updatedAt)}
          </p>
        </div>

        <div className="prose max-w-none">
          <h3 className="font-black uppercase text-xs text-gray-500 mb-2">Message</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-bold">{ticket.message}</p>
        </div>

        {ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? (
          <div className="mt-6 p-4 bg-acid/20 border-2 border-acid rounded-xl">
            <p className="font-black">This ticket has been {ticket.status.toLowerCase()}.</p>
            {ticket.status === "RESOLVED" && (
              <p className="text-sm text-gray-600 font-bold mt-1">
                If you need further assistance, please open a new ticket.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 p-4 bg-ink/5 border-2 border-ink/20 rounded-xl">
            <p className="text-sm text-gray-500 font-bold">
              Our support team will respond to this ticket soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
