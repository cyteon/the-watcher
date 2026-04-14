import { useParams } from "@solidjs/router";
import { createSignal, onMount, createEffect, onCleanup, For } from "solid-js";
import { getMonitor, MonitorData } from "~/lib/server/monitors";

export default function Monitor() {
  const params = useParams();

  const [monitor, setMonitor] = createSignal<MonitorData | undefined>();
  const [maxBars, setMaxBars] = createSignal(20);

  onMount(async () => {
    setMonitor(await getMonitor(Number(params.id)));
  });

  createEffect(async () => {
    setMonitor(await getMonitor(Number(params.id)));
  });

  return (
    <main class="flex-1 flex flex-col w-full">
      <div class="flex flex-col md:flex-row mt-1.75">
        <h1 class="text-2xl">{monitor()?.monitor.name}</h1>
        <a
          class="md:ml-auto mt-2 md:my-auto text-sm text-blue-300 hover:underline"
          href={monitor()?.monitor.target}
          target="_blank"
        >
          {monitor()?.monitor.target}
        </a>
      </div>
      <div class="flex mt-4">buttons</div>
      <div class="border rounded-md p-2 flex mt-4">
        <div
          class="flex-1 min-w-0 ml-2 h-full"
          ref={(el) => {
            const observer = new ResizeObserver(([entry]) => {
              setMaxBars(Math.floor((entry.contentRect.width + 4) / 12));
            });
            observer.observe(el);
            onCleanup(() => observer.disconnect());
          }}
        >
          <div class="flex gap-1 h-full">
            <For each={monitor()?.heartbeats.slice(-maxBars())}>
              {(heartbeat, _) => (
                <div
                  class={`w-2 h-full rounded-full my-auto ${heartbeat.status === "up" ? "bg-green-400" : "bg-red-400"}`}
                ></div>
              )}
            </For>
          </div>
        </div>

        <span
          class={`mx-8 justify-end border p-1 px-4 rounded-md text-neutral-900 font-semibold ${monitor()?.heartbeats.slice(-1)[0]?.status === "up" ? "bg-green-400" : "bg-red-400"}`}
        >
          {monitor()?.heartbeats.slice(-1)[0]?.status.toUpperCase() ||
            "PENDING"}
        </span>
      </div>
    </main>
  );
}
