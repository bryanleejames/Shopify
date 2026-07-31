// Client-side auth helpers for checking sessions and managing login state
import { createServerFn } from "@tanstack/react-start";
import { getSession } from "./auth";

// Server function to validate session from a token
const validateSessionFn = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(async ({ data: token }) => {
    return getSession(token);
  });

// Client-side helpers for cookie-based session management
export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)truthwell_session=([^;]*)/);
  return match ? match[1] : null;
}

export function clearSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = "truthwell_session=; path=/; max-age=0; SameSite=Lax";
}

// Validate the current session with the server
export async function validateSession(): Promise<{
  valid: boolean;
  user?: { id: string; email: string; name: string; isPremium: boolean };
}> {
  const token = getSessionToken();
  if (!token) return { valid: false };
  return validateSessionFn({ data: token });
}

// Client-side logout
export function clientLogout(): void {
  clearSession();
  // Call server to invalidate the session
  fetch("/api/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/";
}

export { validateSessionFn };