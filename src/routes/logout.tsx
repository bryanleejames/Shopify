import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { logout } from "~/lib/auth";

const logoutFn = createServerFn({ method: "POST" })
  .validator((token: string) => token)
  .handler(async ({ data: token }) => {
    return logout(token);
  });

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

function LogoutPage() {
  // This should never render since beforeLoad redirects
  return null;
}