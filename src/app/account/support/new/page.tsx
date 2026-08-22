import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createSupportTicket } from "@/actions/account-actions";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function handleSubmit(formData: FormData) {
    "use server";
    await createSupportTicket(null, formData);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase">New Support Ticket</h1>

      <div className="bg-white border-2 border-ink shadow-brut-lg rounded-3xl p-8">
        <form action={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-black text-gray-500 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                required
                placeholder="Brief summary of your issue..."
                className="w-full border-2 border-ink rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-acid"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-black text-gray-500 mb-1">Message</label>
              <textarea
                name="message"
                required
                minLength={10}
                rows={6}
                placeholder="Describe your issue in detail..."
                className="w-full border-2 border-ink rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-acid resize-y"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-ink text-white border-2 border-ink shadow-brut-md py-3 px-6 rounded-2xl font-black uppercase text-sm hover:bg-acid hover:text-ink transition-colors"
              >
                Submit Ticket
              </button>
              <Link
                href="/account/support"
                className="border-2 border-ink px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-ink/5 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
