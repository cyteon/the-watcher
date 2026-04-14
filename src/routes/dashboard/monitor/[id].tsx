import { useParams } from "@solidjs/router";
import { createSignal, onMount, createEffect } from "solid-js";
import { getMonitor } from "~/lib/server/monitors";

export default function Monitor() {
  const params = useParams();

  const [monitor, setMonitor] = createSignal();

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
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">todo</div>
    </main>
  );
}
