import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, onMount, createEffect, onCleanup, For } from "solid-js";
import { setKey } from "~/components/Sidebar";
import { getStatusPage } from "~/lib/server/statusPages";
import { getStatusColor } from "~/lib/util";

export default function Monitor() {
  const params = useParams();
  const navigate = useNavigate();

  const [page, setPage] = createSignal<
    { name: string; slug: string } | undefined
  >();
  const [maxBars, setMaxBars] = createSignal(20);

  onMount(async () => {
    setPage(await getStatusPage(params.slug!));
  });

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-4xl mt-4 mx-auto">{page()?.name}</h1>
    </main>
  );
}
