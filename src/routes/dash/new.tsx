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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export default function New() {
  const [name, setName] = createSignal("");
  const [type, setType] = createSignal("Web");
  const [url, setUrl] = createSignal(""); // Also counts as host
  const [interval, setInterval] = createSignal(5);
  const [_public, setPublic] = createSignal(false);
  const [webhook, setWebhook] = createSignal("");

  const label = () => {
    if (type() == "Web") {
      return "URL";
    } else if (type() == "Ping") {
      return "Host";
    } else if (type() == "MongoDB") {
      return "Connection String";
    }
  };

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
        type: type(),
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

        <Select
          options={["Web", "Ping", "MongoDB"]}
          class="w-full max-w-xs mt-2"
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
          )}
          onChange={(item) => setType(item)}
          value={type()}
        >
          <label class="text-sm">Monitor Type</label>
          <SelectTrigger>
            <SelectValue<string>>
              {(state) => state.selectedOption()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <TextFieldRoot class="w-full max-w-xs mt-2">
          <TextFieldLabel>{label()}</TextFieldLabel>
          <TextField
            type="url"
            placeholder={label()}
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
