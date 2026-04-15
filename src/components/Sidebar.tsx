import { For, onMount, createSignal, createEffect, onCleanup } from "solid-js";
import { monitors, heartbeats } from "~/lib/server/db/schema";
import { getMonitors, MonitorData } from "~/lib/server/monitors";
import { getStatusColor } from "~/lib/util";

// for reloading
export const [key, setKey] = createSignal(0);

export default function Sidebar() {
  const [monitors, setMonitors] = createSignal<MonitorData[]>([]);
  const [maxBars, setMaxBars] = createSignal(20);

  onMount(async () => {
    setMonitors(await getMonitors());
  });

  createEffect(async () => {
    if (key()) {
      setMonitors(await getMonitors());
    }
  });

  return (
    <div class="flex flex-col lg:w-1/3" key={key()}>
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
              <p class="text-sm border rounded-md my-auto mr-2 w-16 text-center shrink-0">
                {d.uptimePercentage.toFixed(2)}%
              </p>

              <h2 class="shrink-0">{d.monitor.name}</h2>

              <div
                class="flex-1 min-w-0 ml-2"
                ref={(el) => {
                  const observer = new ResizeObserver(([entry]) => {
                    setMaxBars(Math.floor((entry.contentRect.width + 4) / 12));
                  });
                  observer.observe(el);
                  onCleanup(() => observer.disconnect());
                }}
              >
                <div class="flex gap-1 h-full justify-end">
                  <For each={d.heartbeats.slice(-maxBars())}>
                    {(heartbeat, _) => (
                      <div
                        class={`w-2 h-full rounded-full my-auto bg-${getStatusColor(heartbeat.status)}`}
                      ></div>
                    )}
                  </For>
                </div>
              </div>
            </a>
          )}
        </For>
      </div>
    </div>
  );
}
