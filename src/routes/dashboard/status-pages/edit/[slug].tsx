import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, For, Show, onMount } from "solid-js";
import { getMonitors, MonitorData } from "~/lib/server/monitors";
import { getStatusPage, updateStatusPage } from "~/lib/server/statusPages";

export default function StatusPages() {
  const navigate = useNavigate();
  const params = useParams();

  const [page, setPage] = createSignal<
    { name: string; slug: string; monitors: number[] } | undefined
  >(undefined);

  const [monitors, setMonitors] = createSignal<MonitorData[]>([]);
  const [dropdownOpen, setDropdownOpen] = createSignal(false);

  onMount(async () => {
    try {
      const statusPage = await getStatusPage(params.slug!);

      setPage({
        name: statusPage.name,
        slug: statusPage.slug,
        monitors: statusPage.monitors.split(",").filter(Boolean).map(Number),
      });
    } catch (e) {
      console.error(e);
      navigate("/dashboard/status-pages");
    }

    try {
      setMonitors(await getMonitors());
    } catch (e) {
      console.error(e);
    }
  });

  function toggleMonitor(id: number) {
    setPage((p) => {
      if (!p) return p;

      return {
        ...p,
        monitors: p.monitors.includes(id)
          ? p.monitors.filter((m) => m !== id)
          : [...p.monitors, id],
      };
    });
  }

  async function save() {
    if (!page()?.name || !page()?.slug) {
      alert("All fields are required");
      return;
    }

    try {
      await updateStatusPage(params.slug!, {
        name: page()!.name,
        slug: page()!.slug,
        monitors: page()!.monitors.join(","),
      });

      navigate(`/status/${page()!.slug}`);
    } catch (e) {
      console.error(e);
      alert("Failed to update status page");
      return;
    }
  }

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Edit: {page()?.name}</h1>

      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">
        <label class="mb-2">Name</label>
        <input
          type="text"
          placeholder="Name"
          class="mb-2"
          value={page()?.name}
          onInput={(e) =>
            setPage((p) => p && { ...p, name: e.currentTarget.value })
          }
        />

        <label class="mb-2">Slug</label>

        <div class="flex mb-2">
          <div class="bg-neutral-800 align-middle text-center flex px-4 rounded-l-md">
            <p class="my-auto text-nowrap">/status/</p>
          </div>

          <input
            type="text"
            placeholder="Slug"
            class="rounded-l-none!"
            value={page()?.slug}
            onInput={(e) =>
              setPage((p) => p && { ...p, slug: e.currentTarget.value })
            }
          />
        </div>

        <label class="mb-2">Monitors</label>
        <div class="relative mb-2">
          <button
            class="w-full border rounded-md p-2 text-left flex justify-between items-center bg-neutral-900 min-h-10 hover:bg-neutral-900! hover:border-neutral-700!"
            onClick={() => setDropdownOpen(!dropdownOpen())}
          >
            <span class="flex flex-wrap gap-1">
              <Show
                when={(page()?.monitors.length ?? 0) > 0}
                fallback={
                  <span class="text-neutral-500">Select monitors...</span>
                }
              >
                <For each={page()?.monitors ?? []}>
                  {(id) => {
                    const monitor = monitors().find((m) => m.monitor.id === id);

                    return (
                      <span class="px-2 py-0.5 rounded-md border text-sm flex items-center gap-2">
                        {monitor?.monitor.name ?? `#${id}`}
                        <button
                          type="button"
                          class="no-style text-red-400 text-xl hover:cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMonitor(id);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  }}
                </For>
              </Show>
            </span>
            <span class="ml-2">{dropdownOpen() ? "▲" : "▼"}</span>
          </button>

          <Show when={dropdownOpen()}>
            <div class="absolute z-10 w-full mt-1 border rounded-md bg-neutral-900 max-h-60 overflow-y-auto">
              <Show
                when={monitors().length > 0}
                fallback={
                  <div class="p-2 text-neutral-500">No monitors available</div>
                }
              >
                <For each={monitors()}>
                  {(monitor) => {
                    const selected = () =>
                      page()?.monitors.includes(monitor.monitor.id) ?? false;

                    return (
                      <div
                        class="p-2 hover:bg-neutral-800 cursor-pointer flex items-center gap-2"
                        classList={{ "bg-neutral-800": selected() }}
                        onClick={() => toggleMonitor(monitor.monitor.id)}
                      >
                        <span>{monitor.monitor.name}</span>
                        <span class="text-neutral-500 text-sm ml-auto">
                          {monitor.monitor.type}
                        </span>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div>
          </Show>
        </div>

        <button class="button mt-2" onClick={save}>
          Save
        </button>
      </div>
    </main>
  );
}
