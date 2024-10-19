import { createSignal, onMount } from "solid-js";
import { getCookie } from "typescript-cookie";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  TextField,
  TextFieldRoot,
  TextFieldLabel,
} from "~/components/ui/textfield";

export default function New() {
  const [name, setName] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [interval, setInterval] = createSignal(5);
  const [webhook, setWebhook] = createSignal("");

  const addMonitor = async () => {
    const token = getCookie("token");
    const res = await fetch("/api/admin/monitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name(),
        url: url(),
        interval: interval(),
        webhook: webhook(),
      }),
    });

    if (res.ok) {
      window.location.href = "/dash";
    }
  };

  return (
    <main class="w-full h-screen flex">
      <div class="bg-background w-full border-border border-[1px] p-3 m-3 rounded-lg">
        <h1 class="text-2xl font-bold">New Monitor</h1>
        <TextFieldRoot class="w-full max-w-xs mt-2">
          <TextFieldLabel>Name</TextFieldLabel>
          <TextField
            type="name"
            placeholder="Name"
            onInput={(e) => setName(e.target.value)}
          />
        </TextFieldRoot>

        <TextFieldRoot class="w-full max-w-xs mt-2">
          <TextFieldLabel>URL</TextFieldLabel>
          <TextField
            type="url"
            placeholder="URL"
            onInput={(e) => setUrl(e.target.value)}
          />
        </TextFieldRoot>

        <TextFieldRoot class="w-full max-w-xs mt-2">
          <TextFieldLabel>Interval</TextFieldLabel>
          <TextField
            type="number"
            placeholder="Interval"
            onInput={(e) => setInterval(e.target.value)}
          />
        </TextFieldRoot>

        <TextFieldRoot class="w-full max-w-xs mt-2">
          <TextFieldLabel>Notification Webhook</TextFieldLabel>
          <TextField
            type="url"
            placeholder="Webhook"
            onInput={(e) => setWebhook(e.target.value)}
          />
        </TextFieldRoot>

        <Button class="mt-2" onClick={() => addMonitor()}>
          Create
        </Button>
      </div>
    </main>
  );
}
