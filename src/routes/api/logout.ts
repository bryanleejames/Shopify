import { createAPIFileRoute } from "@tanstack/react-start/api";
import { logout } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/logout")({
  POST: async ({ request }) => {
    // Get session token from cookie header
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/truthwell_session=([^;]+)/);
    const token = match ? match[1] : "";

    if (token) {
      await logout(token);
    }

    // Clear the cookie
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "truthwell_session=; path=/; max-age=0; SameSite=Lax",
      },
    });
  },
});