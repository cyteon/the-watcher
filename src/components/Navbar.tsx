import { useLocation } from "@solidjs/router";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav class="border-b p-2 px-4 flex">
      <h1 class="font-bold text-lg">The Watcher</h1>

      <div class="ml-auto my-auto flex text-neutral-300">
        <a
          href="/dashboard"
          class={`hover:underline ${location.pathname === "/dashboard" ? "underline" : ""}`}
        >
          dashboard
        </a>

        <p class="mx-2 text-neutral-500">\</p>

        <a
          href="/dashboard/status-pages"
          class={`hover:underline ${location.pathname === "/dashboard/status-pages" ? "underline" : ""}`}
        >
          status pages
        </a>

        <p class="mx-2 text-neutral-500">\</p>

        <a
          href="/dashboard/settings"
          class={`hover:underline ${location.pathname.startsWith("/dashboard/settings") ? "underline" : ""}`}
        >
          settings
        </a>
      </div>
    </nav>
  );
}
