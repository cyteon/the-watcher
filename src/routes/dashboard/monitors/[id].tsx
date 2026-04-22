import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, onMount, createEffect, onCleanup, For } from "solid-js";
import { setKey } from "~/components/Sidebar";
import {
  getMonitor,
  MonitorData,
  deleteMonitor as serverDeleteMonitor,
  updateMonitor,
} from "~/lib/server/monitors";
import { getStatusColor } from "~/lib/util";

export default function Monitor() {
  const params = useParams();
  const navigate = useNavigate();

  const [monitor, setMonitor] = createSignal<MonitorData | undefined>();
  const [maxBars, setMaxBars] = createSignal(20);

  onMount(async () => {
    setMonitor(await getMonitor(Number(params.id)));
  });

  createEffect(async () => {
    setMonitor(await getMonitor(Number(params.id)));
  });

  async function pauseUnpaseMonitor() {
    if (!monitor()) return;

    await updateMonitor(Number(params.id), {
      paused: !monitor()?.monitor.paused,
    });

    setMonitor(await getMonitor(Number(params.id)));
    setKey((k) => k + 1);
  }

  async function deleteMonitor() {
    if (
      !window.confirm(
        "This will permamently delete the monitor and all its data.",
      )
    ) {
      return;
    }

    try {
      await serverDeleteMonitor(Number(params.id));
      setKey((k) => k + 1); // reload sidebar
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    }
  }

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
      <div class="flex mt-4">
        <button class="mr-2 px-4!" onClick={pauseUnpaseMonitor}>
          {monitor()?.monitor.paused ? "Resume" : "Pause"} Monitor
        </button>
        <button
          class="px-4! hover:bg-red-400! hover:text-neutral-900!"
          onClick={deleteMonitor}
        >
          Delete Monitor
        </button>
      </div>
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
          <div class="flex gap-1 h-full justify-end">
            <For each={monitor()?.heartbeats.slice(-maxBars())}>
              {(heartbeat, _) => (
                <div
                  class={`w-2 h-full rounded-full my-auto bg-${getStatusColor(heartbeat.status)}`}
                ></div>
              )}
            </For>
          </div>
        </div>

        <span
          class={`ml-8 mr-7 justify-end border p-1 px-4 rounded-md text-neutral-900 font-semibold bg-${getStatusColor(monitor()?.heartbeats.slice(-1)[0]?.status || "pending")}`}
        >
          {monitor()?.heartbeats.slice(-1)[0]?.status.toUpperCase() ||
            "PENDING"}
        </span>
      </div>
    </main>
  );
}
