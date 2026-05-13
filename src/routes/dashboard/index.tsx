import { useNavigate } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { getOverview } from "~/lib/server/monitors";

export default function Dashboard() {
  const [overview, setOverview] = createSignal<{
    up: number;
    down: number;
    total: number;
  }>();

  onMount(async () => {
    setOverview(await getOverview());
  });

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Overview</h1>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
    </main>
  );
}
