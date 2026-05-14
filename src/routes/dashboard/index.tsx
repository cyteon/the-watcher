import { useNavigate } from "@solidjs/router";
import { createSignal, For, onMount } from "solid-js";
import { messages } from "~/lib/server/db/schema";
import { getOverview } from "~/lib/server/monitors";
import { getStatusColor } from "~/lib/util";

export default function Dashboard() {
  const [overview, setOverview] = createSignal<{
    up: number;
    down: number;
    total: number;
    latestMessages: (typeof messages.$inferSelect & {
      monitorName: string;
    })[];
  }>();

  onMount(async () => {
    setOverview(await getOverview());

    console.log(overview());
  });

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Overview</h1>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div class="flex flex-col border rounded-md p-2 h-32">
            <h3>Online Monitors</h3>
            <p class="m-auto text-4xl text-green-400">{overview()?.up}</p>
          </div>

          <div class="flex flex-col border rounded-md p-2 h-32">
            <h3>Offline Monitors</h3>
            <p class="m-auto text-4xl text-red-400">{overview()?.down}</p>
          </div>

          <div class="flex flex-col border rounded-md p-2 h-32">
            <h3>Total Monitors</h3>
            <p class="m-auto text-4xl text-blue-400">{overview()?.total}</p>
          </div>
        </div>

        <h2 class="text-xl mt-4">Latest Events</h2>

        <table class="mt-4 w-full border rounded-md">
          <thead>
            <tr>
              <th class="border p-2 text-left">Monitor</th>
              <th class="border p-2 text-left">Timestamp</th>
              <th class="border p-2 text-left">Status</th>
              <th class="border p-2 text-left">Message</th>
            </tr>
          </thead>

          <tbody>
            <For each={overview()?.latestMessages}>
              {(message) => (
                <tr>
                  <td class="border p-2">{message.monitorName}</td>
                  <td class="border p-2">
                    {new Date(message.timestamp).toLocaleString()}
                  </td>
                  <td
                    class="border p-2"
                    class={`text-${getStatusColor(message.status)}`}
                  >
                    {message.status}
                  </td>
                  <td class="border p-2">{message.message}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </main>
  );
}
