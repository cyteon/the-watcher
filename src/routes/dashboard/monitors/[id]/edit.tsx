import { useNavigate, useParams } from "@solidjs/router";
import {
  createSignal,
  createEffect,
  onCleanup,
  For,
  onMount,
  Show,
} from "solid-js";
import { setKey } from "~/components/Sidebar";
import { notificationTargets } from "~/lib/server/db/schema";
import { getMonitor, MonitorData, updateMonitor } from "~/lib/server/monitors";
import { getNotificationTargets } from "~/lib/server/notificationTargets";

export default function EditMonitor() {
  const params = useParams();
  const navigate = useNavigate();

  const [monitor, setMonitor] = createSignal<MonitorData | undefined>();

  const [name, setName] = createSignal("");
  const [type, setType] = createSignal<"http" | "ping">("http");
  const [target, setTarget] = createSignal("");
  const [interval, setInterval] = createSignal(60);

  const [notify, setNotify] = createSignal<number[]>([]);
  const [targets, setTargets] = createSignal<
    (typeof notificationTargets.$inferSelect)[]
  >([]);
  const [dropdownOpen, setDropdownOpen] = createSignal(false);

  const [error, setError] = createSignal("");

  onMount(async () => {
    try {
      setTargets(await getNotificationTargets());
    } catch (e) {
      console.error(e);
    }
  });

  createEffect(async () => {
    setMonitor(await getMonitor(Number(params.id)));

    setName(monitor()?.monitor.name || "");
    setType((monitor()?.monitor.type as "http" | "ping") || "http");
    setTarget(monitor()?.monitor.target || "");
    setInterval(monitor()?.monitor.interval || 60);
    setNotify(monitor()?.monitor.notify?.filter(Boolean).map(Number) || []);
  });

  function toggleNotify(id: number) {
    setNotify((n) => (n.includes(id) ? n.filter((i) => i !== id) : [...n, id]));
  }

  const targetLabel = () => {
    if (type() === "http") return "URL";
    if (type() === "ping") return "Host";
  };

  const targetPlaceholder = () => {
    if (type() === "http") return "https://example.com";
    if (type() === "ping") return "1.1.1.1";
  };

  async function saveMonitor() {
    if (!monitor()) return;

    setError("");

    if (!name() || !target()) {
      setError("Name and target are required.");
      return;
    }

    if (interval() <= 0) {
      setError("Interval must be greater than 0 seconds.");
      return;
    }

    try {
      await updateMonitor(Number(params.id), {
        name: name(),
        type: type(),
        target: target(),
        interval: interval(),
        notify: notify(),
      });

      setKey((k) => k + 1);

      navigate(`/dashboard/monitors/${params.id}`);
    } catch (e) {
      console.error(e);
      setError("An error occurred while saving the monitor.");
    }
  }

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Editing: {monitor()?.monitor.name}</h1>

      <div class="flex flex-col p-2 border rounded-md mt-5 h-full">
        <label class="mb-2">Name</label>
        <input
          type="text"
          placeholder="Name"
          class="mb-2"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
        />

        <label class="mb-2">Monitor Type</label>
        <select
          class="mb-2"
          value={type()}
          onInput={(e) => setType(e.currentTarget.value)}
        >
          <optgroup label="Standard">
            <option value="http">HTTP</option>
            <option value="ping">Ping</option>
          </optgroup>
        </select>

        <label class="mb-2">{targetLabel()}</label>
        <input
          type="text"
          placeholder={targetPlaceholder()}
          class="mb-2"
          value={target()}
          onInput={(e) => setTarget(e.currentTarget.value)}
        />

        <label class="mb-2">Interval (in seconds)</label>
        <input
          type="number"
          placeholder="Interval"
          class="mb-2"
          value={interval()}
          onInput={(e) => setInterval(e.currentTarget.value)}
        />

        <label class="mb-2">Notification Targets</label>
        <div class="relative mb-2">
          <button
            class="w-full border rounded-md p-2 text-left flex justify-between items-center bg-neutral-900 min-h-10 hover:bg-neutral-900! hover:border-neutral-700!"
            onClick={() => setDropdownOpen(!dropdownOpen())}
          >
            <span class="flex flex-wrap gap-1">
              <Show
                when={notify().length > 0}
                fallback={
                  <span class="text-neutral-500">
                    Select notification targets...
                  </span>
                }
              >
                <For each={notify()}>
                  {(id) => {
                    const t = targets().find((x) => x.id === id);
                    return (
                      <span class="px-2 py-0.5 rounded-md border text-sm flex items-center gap-2">
                        {t ? `${t.name} [${t.type}]` : `#${id}`}
                        <button
                          type="button"
                          class="no-style text-red-400 text-xl hover:cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNotify(id);
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
                when={targets().length > 0}
                fallback={
                  <div class="p-2 text-neutral-500">
                    No notification targets available
                  </div>
                }
              >
                <For each={targets()}>
                  {(t) => {
                    const selected = () => notify().includes(t.id);
                    return (
                      <div
                        class="p-2 hover:bg-neutral-800 cursor-pointer flex items-center gap-2"
                        classList={{ "bg-neutral-800": selected() }}
                        onClick={() => toggleNotify(t.id)}
                      >
                        <span>{t.name}</span>
                        <span class="text-neutral-500 text-sm ml-auto">
                          {t.type}
                        </span>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div>
          </Show>
        </div>

        {error() && <p class="text-red-400 mt-2">{error()}</p>}

        <button class="mt-2" onClick={saveMonitor}>
          Save Changes
        </button>
      </div>
    </main>
  );
}
