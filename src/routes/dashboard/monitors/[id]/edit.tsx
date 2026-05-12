import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, onMount, createEffect, onCleanup, For } from "solid-js";
import { setKey } from "~/components/Sidebar";
import { getMonitor, MonitorData, updateMonitor } from "~/lib/server/monitors";
import { getStatusColor } from "~/lib/util";

export default function EditMonitor() {
  const params = useParams();
  const navigate = useNavigate();

  const [monitor, setMonitor] = createSignal<MonitorData | undefined>();

  const [name, setName] = createSignal("");
  const [type, setType] = createSignal<"http" | "ping">("http");
  const [target, setTarget] = createSignal("");
  const [interval, setInterval] = createSignal(60);

  const [error, setError] = createSignal("");

  onMount(async () => {
    setMonitor(await getMonitor(Number(params.id)));

    setName(monitor()?.monitor.name || "");
    setType((monitor()?.monitor.type as "http" | "ping") || "http");
    setTarget(monitor()?.monitor.target || "");
    setInterval(monitor()?.monitor.interval || 60);
  });

  createEffect(async () => {
    setMonitor(await getMonitor(Number(params.id)));

    setName(monitor()?.monitor.name || "");
    setType((monitor()?.monitor.type as "http" | "ping") || "http");
    setTarget(monitor()?.monitor.target || "");
    setInterval(monitor()?.monitor.interval || 60);
  });

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

        {error() && <p class="text-red-400 mt-2">{error()}</p>}

        <button class="mt-2" onClick={saveMonitor}>
          Save Changes
        </button>
      </div>
    </main>
  );
}
