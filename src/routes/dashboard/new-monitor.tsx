import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { createMonitor } from "~/lib/server/monitors";

export default function NewMonitor() {
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [type, setType] = createSignal("http");
  const [target, setTarget] = createSignal("");
  const [interval, setInterval] = createSignal(60);

  const [error, setError] = createSignal("");

  const targetLabel = () => {
    if (type() === "http") return "URL";
    if (type() === "ping") return "Host";
  };

  const targetPlaceholder = () => {
    if (type() === "http") return "https://example.com";
    if (type() === "ping") return "1.1.1.1";
  };

  async function create() {
    if (!name() || !type() || !target()) {
      setError("All fields are required");
      return;
    }

    try {
      await createMonitor({
        name: name(),
        type: type() as "http" | "ping",
        target: target(),
        interval: interval(),
      });

      navigate("/dashboard");
    } catch (e) {
      setError("Failed to create monitor");
      return;
    }
  }

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Create New Monitor</h1>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">
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

        <button class="mt-2" onClick={create}>
          Create
        </button>
        {error() && <p class="mt-2 text-red-400">{error()}</p>}
      </div>
    </main>
  );
}
