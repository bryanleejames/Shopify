import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/journal/count")({
  GET: async ({ request }) => {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/truthwell_session=([^;]+)/);
    const token = match ? match[1] : "";

    if (!token) {
      return new Response(JSON.stringify({ count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Import validateSession dynamically to avoid circular deps
    const { getSession } = await import("~/lib/auth");
    const session = await getSession(token);
    
    if (!session.valid || !session.user) {
      return new Response(JSON.stringify({ count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { getJournalEntries } = await import("~/lib/journal.server");
    const entries = await getJournalEntries(session.user.id);
    return new Response(JSON.stringify({ count: entries.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});