import { useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import Navbar from "~/components/Navbar";
import SettingsNavbar from "~/components/SettingsNavbar";
import Sidebar from "~/components/Sidebar";

export default function DashboardLayout(props: { children: Node }) {
  const location = useLocation();

  return (
    <div class="h-screen flex flex-col">
      <Navbar />

      <Show when={location.pathname.startsWith("/dashboard/settings")}>
        <SettingsNavbar />
      </Show>

      <div class="flex flex-col lg:flex-row p-4 flex-1 space-y-2 lg:space-y-0 lg:space-x-4">
        <Show when={!location.pathname.startsWith("/dashboard/settings")}>
          <Sidebar />
        </Show>

        {props.children}
      </div>
    </div>
  );
}
