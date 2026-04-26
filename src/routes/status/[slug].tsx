import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, onMount, For, onCleanup } from "solid-js";
import { getStatusPage } from "~/lib/server/statusPages";
import { getStatusColor } from "~/lib/util";

export default function Monitor() {
  const params = useParams();

  const [page, setPage] = createSignal<
    | {
        name: string;
        slug: string;
        monitorsData: { id: number; name: string; uptimePercentage: number }[];
      }
    | undefined
  >();

  const [maxBars, setMaxBars] = createSignal(20);

  onMount(async () => {
    setPage(await getStatusPage(params.slug!));
    console.log(page());
  });

  return (
    <main class="flex-1 flex flex-col w-full px-4">
      <h1 class="text-4xl mt-4 mx-auto">{page()?.name}</h1>

      <For each={page()?.monitorsData}>
        {(monitor) => (
          <div class="w-full max-w-2xl mx-auto mt-6 p-2 rounded-md border flex items-center gap-4">
            <p class="border rounded-md px-2 py-1 text-sm">
              {monitor.uptimePercentage.toFixed(2)}%
            </p>

            <h2 class="text-xl">{monitor.name}</h2>

            <div
              class="flex-1 min-w-0 ml-2 h-6 "
              ref={(el) => {
                const observer = new ResizeObserver(([entry]) => {
                  setMaxBars(Math.floor((entry.contentRect.width + 4) / 12));
                });

                observer.observe(el);
                onCleanup(() => observer.disconnect());
              }}
            >
              <div class="flex gap-1 h-full justify-end">
                <For each={monitor.heartbeats.slice(-maxBars())}>
                  {(heartbeat, _) => (
                    <div
                      class={`w-2 h-full rounded-full my-auto bg-${getStatusColor(heartbeat.status)}`}
                    ></div>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      </For>
    </main>
  );
}
