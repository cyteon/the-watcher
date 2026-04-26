import { useNavigate } from "@solidjs/router";
import { createSignal, For, onMount } from "solid-js";
import { getStatusPages } from "~/lib/server/statusPages";

export default function StatusPages() {
  const navigate = useNavigate();

  const [pages, setPages] = createSignal<{ name: string; slug: string }[]>([]);

  onMount(async () => {
    setPages(await getStatusPages());
  });

  return (
    <main class="flex-1 flex flex-col w-full">
      <div class="flex flex-col md:flex-row">
        <h1 class="text-2xl mt-1.75">Status Pages</h1>
        <a
          href="/dashboard/status-pages/new"
          class="button px-4! w-fit md:ml-auto mt-2 md:mt-0.5"
        >
          + New Status Page
        </a>
      </div>

      <div class="border rounded-md p-2 flex-1 flex flex-col mt-4">
        <For each={pages()}>
          {(page) => (
            <div
              onClick={() => navigate(`/status/${page.slug}`)}
              class="p-2 px-4 rounded-md border hover:border-neutral-700! hover:cursor-pointer flex"
            >
              <div>
                <h3 class="font-bold text-lg">{page.name}</h3>

                <p class="text-sm text-neutral-500">/status/{page.slug}</p>
              </div>

              <a
                class="button ml-auto my-auto py-1! px-4!"
                href={`/dashboard/status-pages/edit/${page.slug}`}
              >
                Edit
              </a>
            </div>
          )}
        </For>
      </div>
    </main>
  );
}
