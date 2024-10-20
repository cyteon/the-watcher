import { createSignal, onMount } from "solid-js";
import { getCookie } from "typescript-cookie";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  TextField,
  TextFieldRoot,
  TextFieldLabel,
} from "~/components/ui/textfield";

import {
  Checkbox,
  CheckboxControl,
  CheckboxLabel,
} from "~/components/ui/checkbox";

export default function New() {
  const [name, setName] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [interval, setInterval] = createSignal(5);
  const [_public, setPublic] = createSignal(false);
  const [webhook, setWebhook] = createSignal("");

  onMount(() => {
    const token = getCookie("token");
    if (!token) {
      window.location.href = "/dash/login";
    }

    fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) {
        window.location.href = "/dash/login";
      }
    });
  });

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
        _public: _public(),
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

        <Checkbox class="flex items-center my-4">
          <CheckboxControl
            class="hover:cursor-pointer"
            onChange={(e) => setPublic(e.target.checked)}
          />
          <CheckboxLabel class="text-sm ml-1 mt-1 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Make monitor public
          </CheckboxLabel>
        </Checkbox>

        <Button onClick={() => addMonitor()}>Create</Button>
      </div>
    </main>
  );
}
