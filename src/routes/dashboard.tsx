import { useLocation } from "@solidjs/router";
import Sidebar from "~/components/Sidebar";

export default function DashboardLayout(props: { children: Node }) {
  const location = useLocation();

  return (
    <div class="h-screen flex flex-col">
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
        </div>
      </nav>
      <div class="flex flex-col lg:flex-row p-4 flex-1 space-y-2 lg:space-y-0 lg:space-x-4">
        <Sidebar />
        {props.children}
      </div>
    </div>
  );
}
