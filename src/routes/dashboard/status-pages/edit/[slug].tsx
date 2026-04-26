import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, For, onMount } from "solid-js";
import { getStatusPage } from "~/lib/server/statusPages";

export default function StatusPages() {
  const navigate = useNavigate();
  const params = useParams();

  const [page, setPage] = createSignal<
    { name: string; slug: string } | undefined
  >(undefined);

  onMount(async () => {
    setPage(await getStatusPage(params.slug!));
  });

  return (
    <main class="flex-1 flex flex-col w-full">
      <div class="flex flex-col md:flex-row">
        <h1 class="text-2xl mt-1.75">Edit: {page()?.name}</h1>
      </div>
    </main>
  );
}
