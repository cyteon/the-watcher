import { useLocation } from "@solidjs/router";
import { deleteCookie } from "@solidjs/start/http";
import { logoutUser } from "~/lib/server/auth";

export default function SettingsNavbar() {
  const location = useLocation();

  return (
    <nav class="border rounded-md mx-4 mt-4 p-2 px-4 flex">
      <a
        href="/dashboard/settings/account"
        class={`hover:underline ${location.pathname === "/dashboard/settings/account" ? "underline" : ""}`}
      >
        account
      </a>

      <p class="mx-2 text-neutral-500">\</p>

      <a
        href="/dashboard/settings/notifications"
        class={`hover:underline ${location.pathname === "/dashboard/settings/notifications" ? "underline" : ""}`}
      >
        notifications
      </a>

      <p class="mx-2 text-neutral-500">\</p>

      <button
        onClick={async () => {
          await logoutUser();
        }}
        class="no-style hover:underline text-red-400 hover:cursor-pointer"
      >
        log out
      </button>
    </nav>
  );
}
