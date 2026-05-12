import { useLocation } from "@solidjs/router";

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
    </nav>
  );
}
