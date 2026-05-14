import { createSignal, For, onMount } from "solid-js";
import { notificationTargets } from "~/lib/server/db/schema";
import {
  createNotificationTarget,
  getNotificationTargets,
  deleteNotificationTarget,
} from "~/lib/server/notificationTargets";

export default function NotificationsSettings() {
  const [targets, setTargets] = createSignal<
    (typeof notificationTargets.$inferSelect)[]
  >([]);

  onMount(async () => {
    try {
      setTargets(await getNotificationTargets());
    } catch (e) {
      console.error(e);
    }
  });

  const [createName, setCreateName] = createSignal("");
  const [createType, setCreateType] = createSignal<"slack">("slack");
  const [createTarget, setCreateTarget] = createSignal("");

  const [error, setError] = createSignal("");

  const targetLabel = () => {
    if (createType() === "slack") return "Webhook URL";
    return "Target";
  };

  const targetPlaceholder = () => {
    if (createType() === "slack")
      return "https://hooks.slack.com/services/xxx/yyy/zzz";
    return "Target";
  };

  async function createNotifTarget() {
    if (!createName() || !createType() || !createTarget()) {
      setError("All fields are required");
      return;
    }

    try {
      await createNotificationTarget({
        name: createName(),
        type: createType(),
        value: createTarget(),
      });

      setTargets(await getNotificationTargets());

      setCreateName("");
      setCreateType("slack");
      setCreateTarget("");
    } catch (e) {
      setError("Failed to create notification target");
      return;
    }
  }

  return (
    <main class="flex-1 flex flex-col w-full">
      <div class="border rounded-md p-4 h-full flex flex-col md:flex-row gap-4">
        <div class="flex flex-col flex-1">
          <For each={targets()}>
            {(target) => (
              <div class="flex border rounded-md p-2 items-center">
                <p class="ml-2 text-lg">{target.name}</p>
                <p class="text-neutral-500 ml-2">[{target.type}]</p>

                <button
                  class="self-end text-red-400! ml-auto py-1!"
                  onClick={() => {
                    deleteNotificationTarget(target.id);

                    setTargets((t) => t.filter((tt) => tt.id !== target.id));
                  }}
                >
                  delete
                </button>
              </div>
            )}
          </For>
        </div>

        <div class="md:h-full border"></div>

        <div class="flex flex-col flex-1">
          <h2 class="text-2xl">New Target</h2>

          <label class="flex flex-col mt-4 w-full max-w-sm">
            Friendly Name
          </label>

          <input
            type="text"
            placeholder="Example"
            class="mb-2"
            value={createName()}
            onInput={(e) => setCreateName(e.currentTarget.value)}
          />

          <label class="flex flex-col mt-4 w-full max-w-sm">Target Type</label>

          <select
            class="mb-2"
            value={createType()}
            onInput={(e) => setCreateType(e.currentTarget.value as any)}
          >
            <optgroup label="Chat Platforms">
              <option value="slack">Slack</option>
            </optgroup>
          </select>

          <label class="flex flex-col mt-4 w-full max-w-sm">
            {targetLabel()}
          </label>

          <input
            type="text"
            placeholder={targetPlaceholder()}
            class="mb-2"
            value={createTarget()}
            onInput={(e) => setCreateTarget(e.currentTarget.value)}
          />

          {error() && <p class="text-red-400">{error()}</p>}

          <button class="mt-2" onClick={createNotifTarget}>
            Create Target
          </button>
        </div>
      </div>
    </main>
  );
}
