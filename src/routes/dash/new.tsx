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
  const [type, setType] = createSignal("HTTP(s)");
  const [url, setUrl] = createSignal(""); // Also counts as host
  const [interval, setInterval] = createSignal(5);
  const [_public, setPublic] = createSignal(false);
  const [webhook, setWebhook] = createSignal("");

  const label = () => {
    if (type() == "HTTP(s)") {
      return "URL";
    } else if (type() == "Ping" || type() == "TCP") {
      return "Host";
    } else if (type() == "MongoDB") {
      return "Connection String";
    } else {
      return "URL";
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
    <main class="w-full h-screen flex px-1">
      <div class="m-auto bg-background w-full md:w-1/4 border-border border-[1px] p-3 m-3 rounded-lg">
        <h1 class="text-2xl font-bold">New Monitor</h1>
        <TextFieldRoot class="w-full mt-2">
          <TextFieldLabel>Name</TextFieldLabel>
          <TextField
            type="name"
            placeholder="Name"
            onInput={(e) => setName(e.target.value)}
          />
        </TextFieldRoot>

        <Select
          options={[
            "HTTP(s)",
            "Ping",
            "TCP",
            "MongoDB",
            "Server-Side Agent",
            "Push to URL",
          ]}
          class="w-full mt-2"
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

        <Show when={type() != "Server-Side Agent" && type() != "Push to URL"}>
          <TextFieldRoot class="w-full mt-2">
            <TextFieldLabel>{label()}</TextFieldLabel>
            <TextField
              type="url"
              placeholder={label()}
              onInput={(e) => setUrl(e.target.value)}
            />
          </TextFieldRoot>
        </Show>

        <TextFieldRoot class="w-full mt-2">
          <TextFieldLabel>Monitor Interval (minutes)</TextFieldLabel>
          <TextField
            type="number"
            placeholder="Monitor Interval (minutes)"
            onInput={(e) => setInterval(e.target.value)}
          />
        </TextFieldRoot>

        <TextFieldRoot class="w-full mt-2">
          <TextFieldLabel>Notification Webhook</TextFieldLabel>
          <TextField
            type="url"
            placeholder="Webhook"
            onInput={(e) => setWebhook(e.target.value)}
          />
        </TextFieldRoot>

        <Checkbox class="flex items-center my-4" onChange={(e) => setPublic(e)}>
          <CheckboxControl class="hover:cursor-pointer" />
          <CheckboxLabel class="text-sm ml-1 mb-0.5 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Make monitor public
          </CheckboxLabel>
        </Checkbox>

        <Button onClick={() => addMonitor()} class="w-full text-lg">Create</Button>
      </div>
    </main>
  );
}
