import { For, onMount, createSignal } from "solid-js";
import { monitors } from "~/lib/server/db/schema";
import { getMonitors } from "~/lib/server/monitors";

type Monitors = {
  monitor: typeof monitors.$inferSelect;
}[];

export default function Sidebar() {
  const [monitors, setMonitors] = createSignal<Monitors>([]);

  onMount(async () => {
    setMonitors(await getMonitors());
  });

  return (
    <div class="flex flex-col lg:w-1/3">
      <a href="/dashboard/new-monitor" class="button px-4! w-fit">
        + Create New Monitor
      </a>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-4 gap-4">
        <For each={monitors()}>
          {(d, _) => (
            <a
              href={`/dashboard/monitor/${d.monitor.id}`}
              class="flex p-2 border rounded-md hover:border-neutral-700! hover:cursor-pointer"
            >
              <h2>{d.monitor.name}</h2>
            </a>
          )}
        </For>
      </div>
    </div>
  );
}
