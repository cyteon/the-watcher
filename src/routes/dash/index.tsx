import { createEffect, createSignal, onMount } from "solid-js";
import { getCookie, removeCookie } from "typescript-cookie";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  TextField,
  TextFieldRoot,
  TextFieldLabel,
} from "~/components/ui/textfield";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from "~/components/ui/alert-dialog";

import {
  Checkbox,
  CheckboxControl,
  CheckboxLabel,
} from "~/components/ui/checkbox";
import Chart from "~/components/Chart";

function getTime(time: string) {
  return (
    new Date(
      new Date(time).getTime() - new Date(time).getTimezoneOffset() * 60000 * 2,
    ).getTime() / 1000
  );
}

export default function Dash() {
  const [data, setData] = createSignal({});

  const [visibleHeartbeatsSmall, setVisibleHeartbeatsSmall] = createSignal(15);
  const [visibleHeartbeatsBig, setVisibleHeartbeatsBig] = createSignal(50);
  const [currentMonitor, setCurrentMonitor] = createSignal(null);
  const [currentPing, setCurrentPing] = createSignal(null);
  const [currentChartData, setCurrentChartData] = createSignal([]);

  const [currentRamUsage, setCurrentRamUsage] = createSignal([]);
  const [currentCpuUsage, setCurrentCpuUsage] = createSignal([]);
  const [currentDiskUsage, setCurrentDiskUsage] = createSignal([]);
  const [currentLoadAvg, setCurrentLoadAvg] = createSignal([]);

  const [currentRx, setCurrentRx] = createSignal([]);
  const [currentTx, setCurrentTx] = createSignal([]);

  const [newName, setNewName] = createSignal("");
  const [newURL, setNewURL] = createSignal("");
  const [newInterval, setNewInterval] = createSignal(1);
  const [newPublic, setNewPublic] = createSignal(false);
  const [newWebhook, setNewWebhook] = createSignal("");

  const [username, setUsername] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [oldPassword, setOldPassword] = createSignal("");

  const [innerWidth, setInnerWidth] = createSignal(1000);

  const label = () => {
    if (currentMonitor()?.type == "HTTP(s)") {
      return "URL";
    } else if (currentMonitor()?.type  == "Ping" || currentMonitor()?.type  == "TCP") {
      return "Host";
    } else if (currentMonitor()?.type  == "MongoDB") {
      return "Connection String (MongoDB)";
    } else if (currentMonitor()?.type  == "PostgreSQL") {
      return "Connection String (PostgreSQL)";
    } else {
      return "URL";
    }
  };

  createEffect(() => {
    if (currentMonitor()) {
      setCurrentChartData(
        currentMonitor()!
          .heartbeats!.toReversed()
          .map((ping) => ({
            value: ping.ping,
            time:
              new Date(
                new Date(ping.time).getTime() -
                  new Date(ping.time).getTimezoneOffset() * 60000 * 2,
              ).getTime() / 1000,
          })),
      );

      if (currentMonitor()!.type == "Server-Side Agent") {
        setCurrentRamUsage(
          currentMonitor()!
            .heartbeats!.toReversed()
            .map((ping) => ({
              value: ping.ram_usage / 1073741824 || 0,
              time: getTime(ping.time),
            })),
        );

        setCurrentCpuUsage(
          currentMonitor()!
            .heartbeats!.toReversed()
            .map((ping) => ({
              value: ping.cpu_usage || 0,
              time: getTime(ping.time),
            })),
        );

        setCurrentDiskUsage(
          currentMonitor()!
            .heartbeats!.toReversed()
            .map((ping) => ({
              value: ping.disk_usage / 1073741824 || 0,
              time: getTime(ping.time),
            })),
        );

        setCurrentLoadAvg(
          currentMonitor()!
            .heartbeats!.toReversed()
            .map((ping) => ({
              value: ping.load_avg || 0,
              time: getTime(ping.time),
            })),
        );

        setCurrentRx(
          currentMonitor()!
            .heartbeats!.toReversed()
            .map((ping) => ({
              value: ping.rx_bytes / 1048576 || 0,
              time: getTime(ping.time),
            })),
        );

        setCurrentTx(
          currentMonitor()!
            .heartbeats!.toReversed()
            .map((ping) => ({
              value: ping.tx_bytes / 1048576 || 0,
              time: getTime(ping.time),
            })),
        );
      }
    }
  });

  onMount(() => {
    const updateScreenSize = () => {
      if (window.innerWidth >= 1400) {
        setVisibleHeartbeatsSmall(15);
        setVisibleHeartbeatsBig(90);
      } else if (window.innerWidth >= 1200) {
        setVisibleHeartbeatsSmall(10);
        setVisibleHeartbeatsBig(50);
      } else if (window.innerWidth <= 600) {
        // here sidebar AND monitor view is full width
        // and only 1 at time, so we can fit more
        setVisibleHeartbeatsSmall(20);
        setVisibleHeartbeatsBig(30);
      } else {
        setVisibleHeartbeatsSmall(5);
        setVisibleHeartbeatsBig(25);
      }

      setInnerWidth(window.innerWidth);
    };

    window.addEventListener("resize", updateScreenSize);
    updateScreenSize();

    fetch("/api/admin/data", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
    }).then((res) => {
      if (!res.ok) {
        removeCookie("token");
        window.location.href = "/dash/login";
      }

      res.json().then((data) => {
        setData(data);
        setUsername(data.user.username);
      });
    });

    setInterval(() => {
      fetch("/api/admin/data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCookie("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setData(data);

          if (currentMonitor()) {
            setCurrentMonitor(
              data.monitors.find(
                (monitor) => monitor.id == currentMonitor()?.id,
              ),
            );
          }
        });
    }, 60000);

    return () => window.removeEventListener("resize", updateScreenSize);
  });

  async function logOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
    });

    removeCookie("token");

    window.location.href = "/";
  }

  async function editUser() {
    const res = await fetch("/api/auth/change", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
      body: JSON.stringify({
        username: username(),
        oldPassword: oldPassword(),
        newPassword: newPassword(),
      }),
    });

    if (res.ok) {
      setUsername("");
      setOldPassword("");
      setNewPassword("");

      removeCookie("token");
      window.location.href = "/dash/login";
    }
  }

  async function togglePaused() {
    await fetch(`/api/admin/monitor/${currentMonitor()?.id}/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
    });

    setCurrentPing(null);
    setData(
      await (
        await fetch("/api/admin/data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("token")}`,
          },
        })
      ).json(),
    );

    setCurrentMonitor(
      data().monitors.find((monitor) => monitor.id == currentMonitor()?.id),
    );
  }

  async function editMonitor() {
    const res = await fetch(`/api/admin/monitor/${currentMonitor()?.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
      body: JSON.stringify({
        name: newName(),
        url: newURL(),
        interval: newInterval(),
        webhook: newWebhook(),
        _public: newPublic(),
      }),
    });

    if (res.ok) {
      setData(
        await (
          await fetch("/api/admin/data", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getCookie("token")}`,
            },
          })
        ).json(),
      );

      setCurrentMonitor(
        data().monitors.find((monitor) => monitor.id == currentMonitor()?.id),
      );
    }
  }

  async function deleteMonitor() {
    await fetch(`/api/admin/monitors`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
      body: JSON.stringify({ id: currentMonitor()?.id }),
    });

    setCurrentMonitor(null);
    setData(
      await (
        await fetch("/api/admin/data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("token")}`,
          },
        })
      ).json(),
    );
  }

  return (
    <main class="w-full h-screen flex">
      <div
        class={`
        bg-background border-border border-[1px] p-3 m-3 rounded-lg flex flex-col
        ${innerWidth() <= 600 ? (currentMonitor() ? "hidden" : "w-full") : ""}
      `}
      >
        {data().monitors?.map((monitor, index) => (
          <button
            onClick={() => {
              setCurrentMonitor(monitor);
            }}
            class="flex items-center justify-between border-[1px] w-full border-border p-3 mb-1 rounded-md "
          >
            <div>
              <h2 class="text-xl font-bold">{monitor.name}</h2>
            </div>

            <div class="flex justify-end ml-10">
              {monitor.heartbeats
                ?.slice(0, visibleHeartbeatsSmall())
                .toReversed()
                .map((ping) => (
                  <div class="mt-1 min-h-5">
                    <Show when={ping.status == "up"}>
                      <div class="w-1 h-full mx-0.5 rounded-full bg-green-400"></div>
                    </Show>
                    <Show when={ping.status == "paused"}>
                      <div class="w-1 h-full mx-0.5 rounded-full bg-gray-400"></div>
                    </Show>
                    <Show when={ping.status == "degraded"}>
                      <div class="w-1 h-full mx-0.5 rounded-full bg-yellow-200"></div>
                    </Show>
                    <Show when={ping.status == "down"}>
                      <div class="w-1 h-full mx-0.5 rounded-full bg-red-400"></div>
                    </Show>
                  </div>
                ))}
            </div>
          </button>
        ))}
        <Button
          class="w-full mt-2"
          onClick={() => (window.location.href = "/dash/new")}
        >
          + New Monitor
        </Button>
        <div class="mt-auto">
          <AlertDialog>
            <AlertDialogTrigger as={Button} class="w-full">
              Settings
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle class="text-2xl">
                  Edit Profile
                </AlertDialogTitle>
              </AlertDialogHeader>

              <TextFieldRoot class="mb-4">
                <TextFieldLabel>Username</TextFieldLabel>
                <TextField
                  class="w-full"
                  onChange={(e) => setUsername(e.target.value)}
                  value={username()}
                />
              </TextFieldRoot>

              <TextFieldRoot class="mb-4">
                <TextFieldLabel>New Password</TextFieldLabel>
                <TextField
                  class="w-full"
                  type="password"
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </TextFieldRoot>

              <Show when={newPassword()}>
                <TextFieldRoot class="mb-4">
                  <TextFieldLabel>Old Password</TextFieldLabel>
                  <TextField
                    class="w-full"
                    type="password"
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </TextFieldRoot>
              </Show>

              <AlertDialogFooter>
                <AlertDialogAction class="text-lg">
                  Cancel
                </AlertDialogAction>
                <AlertDialogAction onClick={() => logOut()} class="mb-2 md:mb-0 text-lg">
                  Log Out
                </AlertDialogAction>
                <AlertDialogAction onClick={() => editUser()} class="mb-2 md:mb-0 text-lg">
                  Save
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Show when={currentMonitor()}>
        <div class="overflow-y-auto bg-background border-border w-full border-[1px] p-3 m-3 rounded-lg flex flex-col h-[calc(100vh-24px)]">
          <div class="flex-none">
            <div class="flex">
              <Show
                when={
                  currentMonitor()?.heartbeats[0]?.status == "up" &&
                  currentMonitor()?.paused == false
                }
              >
                <Badge
                  variant={"noHover"}
                  class="w-fit rounded-lg bg-green-400 my-auto py-1 px-3"
                >
                  Online
                </Badge>
              </Show>
              <Show
                when={
                  currentMonitor()?.heartbeats[0]?.status == "paused" ||
                  currentMonitor()?.paused == true
                }
              >
                <Badge
                  variant={"noHover"}
                  class="w-fit rounded-lg bg-gray-400 my-auto py-1 px-3"
                >
                  Paused
                </Badge>
              </Show>
              <Show
                when={currentMonitor()?.heartbeats[0]?.status == "degraded"}
              >
                <Badge
                  variant={"noHover"}
                  class="w-fit rounded-lg bg-yellow-200 my-auto py-1 px-3"
                >
                  Degraded
                </Badge>
              </Show>
              <Show when={currentMonitor()?.heartbeats[0]?.status == "down"}>
                <Badge
                  variant={"noHover"}
                  class="w-fit rounded-lg bg-red-400 my-auto py-1 px-3"
                >
                  Offline
                </Badge>
              </Show>

              <Show when={innerWidth() < 600}>
                <button
                  class="ml-auto text-muted-foreground hover:text-foreground mr-2"
                  onClick={() => {
                    setCurrentMonitor(null);
                  }}
                >
                  Back
                </button>
              </Show>
            </div>

            <h1 class="text-3xl mt-2">{currentMonitor()?.name}</h1>
          </div>

          <Show
            when={
              currentMonitor()?.type != "MongoDB" &&
              currentMonitor()?.type != "Push to URL" &&
              currentMonitor()?.type != "PostgreSQL" 
            }
          >
            <a href={currentMonitor()?.url} target="_blank">
              {currentMonitor()?.url}
            </a>
          </Show>

          <Show when={currentMonitor()?.type == "Push to URL"}>
            <a
              href={`${window.location.protocol}//${window.location.host}/api/push/${currentMonitor()?.url}?status=up&ping=`}
              target="_blank"
            >
              {window.location.protocol}//{window.location.host}
              /api/push/{currentMonitor()?.url}?status=up&msg=OK&ping=
            </a>
          </Show>

          <Show when={currentMonitor()?.type == "MongoDB" || currentMonitor()?.type == "PostgreSQL"}>
            <a href={currentMonitor()?.url} target="_blank">
              [redacted connection string]
            </a>
          </Show>

          <div class="my-3 flex">
            <Button class="mr-1 text-lg" onClick={() => togglePaused()}>
              {currentMonitor()?.paused ? "Unpause" : "Pause"}
            </Button>
            <div class="mr-1">
              <AlertDialog>
                <AlertDialogTrigger as={Button} class="text-lg">
                  Edit
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle class="text-2xl">
                      Editing Monitor: {currentMonitor()?.name}
                    </AlertDialogTitle>
                  </AlertDialogHeader>

                  <TextFieldRoot class="mb-4">
                    <TextFieldLabel>Monitor Name</TextFieldLabel>
                    <TextField
                      class="w-full"
                      value={currentMonitor()?.name}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </TextFieldRoot>
                  <Show when={currentMonitor()?.type == "Server-Side Agent"}>
                    <p class="text-sm mb-[-10px]">Install Command</p>
                    <code class="p-2 border rounded-md break-all">
                      curl -OL http://{window.location.host}
                      /agent_installer.sh && sudo bash agent_installer.sh --key=
                      {currentMonitor()?.agent?.token} --url=
                      {window.location.protocol +
                        "//" +
                        window.location.host}{" "}
                      --interval=
                      {currentMonitor()?.interval != newInterval()
                        ? newInterval()
                        : currentMonitor()?.interval}{" "}
                      && rm agent_installer.sh
                    </code>
                  </Show>
                  <Show
                    when={
                      currentMonitor()?.type != "Server-Side Agent" &&
                      currentMonitor()?.type != "Push to URL"
                    }
                  >
                    <TextFieldRoot class="mb-4">
                      <TextFieldLabel>
                        {label()}
                      </TextFieldLabel>
                      <TextField
                        class="w-full"
                        value={currentMonitor()?.url}
                        onChange={(e) => setNewURL(e.target.value)}
                      />
                    </TextFieldRoot>
                  </Show>
                  <TextFieldRoot class="mb-4">
                    <TextFieldLabel>Monitor Interval (minutes)</TextFieldLabel>
                    <TextField
                      class="w-full"
                      type="number"
                      value={currentMonitor()?.interval}
                      onChange={(e) => setNewInterval(e.target.value)}
                    />
                  </TextFieldRoot>
                  <TextFieldRoot class="mb-4">
                    <TextFieldLabel>Notification Webhook</TextFieldLabel>
                    <TextField
                      class="w-full"
                      value={currentMonitor()?.webhook}
                      onChange={(e) => setNewWebhook(e.target.value)}
                    />
                  </TextFieldRoot>

                  <Checkbox
                    class="flex items-center"
                    defaultChecked={currentMonitor()?.public}
                    onChange={(e) => setNewPublic(e)}
                  >
                    <CheckboxControl class="hover:cursor-pointer" />
                    <CheckboxLabel class="text-sm ml-1 mb-0.5 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Public Monitor
                    </CheckboxLabel>
                  </Checkbox>

                  <AlertDialogFooter>
                    <AlertDialogAction class="text-lg">
                      Cancel
                    </AlertDialogAction>
                    <AlertDialogAction
                      onClick={() => editMonitor()}
                      class="text-lg mb-2 md:mb-0"
                    >
                      Save Changes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                as={Button}
                class="bg-red-400 hover:bg-red-400 text-lg"
              >
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Deleting an monitor will
                    delete all of its data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction
                    class="bg-red-400 text-lg"
                    onClick={() => deleteMonitor()}
                  >
                    Continue
                  </AlertDialogAction>

                  <AlertDialogAction class="text-lg mb-2 md:mb-0">
                    Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div class="p-3 border-border border-[1px] mt-2 rounded-md flex flex-col w-full">
            <div class="self-end">
              <Show when={currentMonitor()?.avg_ping}>
                <Badge class="self-end mr-2 w-fit rounded-xl">
                  Avg: {currentMonitor()?.avg_ping?.toFixed(0)}ms
                </Badge>
              </Show>

              <Badge class="self-end w-fit rounded-xl mr-2">
                {(currentMonitor()?.heartbeats[0]?.status == "up" ||
                  currentMonitor()?.heartbeats[0]?.status == "degraded") &&
                currentMonitor()?.type != "Server-Side Agent"
                  ? currentMonitor()?.heartbeats[0]?.ping + "ms"
                  : "N/A ping"}
              </Badge>

              <Badge class="self-end w-fit rounded-xl">
                {currentMonitor()?.uptime
                  ? currentMonitor()?.uptime?.toFixed(1) + "%"
                  : "? uptime"}
              </Badge>
            </div>

            <div class="flex-col flex w-full">
              <div class="flex ml-auto overflow-x-auto">
                {currentMonitor()
                  ?.heartbeats?.slice(0, visibleHeartbeatsBig())
                  .toReversed()
                  .map((ping) => (
                    <div
                      class="mt-1 min-h-8"
                      onMouseOver={() => {
                        setCurrentPing(ping);
                      }}
                      onMouseLeave={() => {
                        setCurrentPing(null);
                      }}
                    >
                      <Show when={ping.status == "up"}>
                        <div class="w-2 h-full mx-0.5 rounded-full bg-green-400"></div>
                      </Show>

                      <Show when={ping.status == "paused"}>
                        <div class="w-2 min-h-4 h-full mx-0.5 rounded-full bg-gray-400"></div>
                      </Show>

                      <Show when={ping.status == "degraded"}>
                        <div class="w-2 min-h-4 h-full mx-0.5 rounded-full bg-yellow-200"></div>
                      </Show>

                      <Show when={ping.status == "down"}>
                        <div class="w-2 min-h-4 h-full mx-0.5 rounded-full bg-red-400"></div>
                      </Show>
                    </div>
                  ))}
              </div>

              <div class="flex mt-1 w-full">
                <Show when={currentPing()}>
                  <Show
                    when={
                      currentPing()?.status == "up" &&
                      currentMonitor()?.type != "Server-Side Agent" &&
                      currentMonitor()?.type != "Push to URL"
                    }
                  >
                    <p class="text-sm text-green-400">{`${
                    new Date(
                      new Date(currentPing()?.time).getTime() - new Date(currentPing()?.time).getTimezoneOffset() * 60000,
                    ).toLocaleString()} ${currentPing()?.code ? "- Status: " + currentPing()?.code : ""} - ${currentPing()?.ping}ms`}</p>
                  </Show>

                  <Show
                    when={
                      currentPing()?.status == "up" &&
                      (currentMonitor()?.type == "Server-Side Agent" ||
                        currentMonitor()?.type == "Push to URL")
                    }
                  >
                    <p class="text-sm text-green-400">{`${currentPing()?.time}`}</p>
                  </Show>

                  <Show when={currentPing()?.status == "degraded"}>
                    <p class="text-sm text-yellow-200">{`${currentPing()?.time} - Status: ${currentPing()?.code} - ${currentPing()?.ping}ms`}</p>
                  </Show>

                  <Show when={currentPing()?.status == "down"}>
                    <p class="text-sm text-red-400">{`${currentPing()?.time} -
                        ${currentPing()?.code != 0 ? "Status: " + currentPing()?.code : "Down"}`}</p>
                  </Show>
                  <Show when={currentPing()?.status == "paused"}>
                    <p class="text-sm text-gray-400">{`${currentPing()?.time} - Paused`}</p>
                  </Show>
                </Show>

                <p class="ml-auto text-sm">Now</p>
              </div>
            </div>
          </div>
          <Show when={currentMonitor()?.type != "Server-Side Agent"}>
            <div class="mt-3 p-3 border rounded-md w-full h-64">
              <Chart data={currentChartData()} suffix="ms" id="pingChart" />
            </div>

            <div class="mt-3 p-3 border rounded-md w-full">
              <h1 class="text-lg mb-2">History</h1>
              {currentMonitor()?.logs.map((log) => (
                <div class="flex items-center mb-2 w-full">
                  <Badge
                    variant={"noHover"}
                    class={`
                      w-16 rounded-lg py-1 px-3 mr-2 justify-center
                      ${log.status == "up"
                        ? "bg-green-400"
                        : log.status == "paused"
                        ? "bg-gray-400"
                        : log.status == "degraded"
                        ? "bg-yellow-200"
                        : log.status == "down"
                        ? "bg-red-400"
                        : "bg-gray-500"}
                    `}
                  >
                    {log.status}
                  </Badge>

                  <span class="text-sm">{log.message}</span>

                  <span class="text-sm text-muted-foreground ml-auto">
                    {new Date(
                      new Date(log.time).getTime() - new Date(log.time).getTimezoneOffset() * 60000,
                    ).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Show>

          <Show when={currentMonitor()?.type == "Server-Side Agent"}>
            <div class="flex mt-2 flex-wrap">
              <div class="border border-border p-5 text-lg rounded-lg mr-3 mt-1">
                <p>Ram Usage</p>
                <p>
                  {(
                    currentMonitor()?.heartbeats[0]?.ram_usage / 1073741824
                  ).toFixed(2)}
                  GB /{" "}
                  {(
                    currentMonitor()?.heartbeats[0]?.ram_max / 1073741824
                  ).toFixed(2)}
                  GB
                </p>
              </div>
              <div class="border border-border p-5 text-lg rounded-lg mr-3 mt-1">
                <p>CPU Usage</p>
                <p>
                  {currentMonitor()?.heartbeats[0]?.cpu_usage?.toFixed(2)}% of{" "}
                  {currentMonitor()?.heartbeats[0]?.cpu_cores} cores
                </p>
              </div>
              <div class="border border-border p-5 text-lg rounded-lg mr-3 mt-1">
                <p>Disk Usage</p>
                <p>
                  {(
                    currentMonitor()?.heartbeats[0]?.disk_usage / 1073741824
                  ).toFixed(2)}
                  GB /
                  {(
                    currentMonitor()?.heartbeats[0]?.disk_capacity / 1073741824
                  ).toFixed(2)}
                  GB
                </p>
              </div>
              <div class="border border-border p-5 text-lg rounded-lg mt-1">
                <p>Load Average</p>
                <p>{currentMonitor()?.heartbeats[0]?.load_avg}%</p>
              </div>
            </div>

            <div class="flex-1 mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 ">
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">RAM Usage</h1>
                  <div class="flex-1">
                    <Chart
                      data={currentRamUsage()}
                      suffix="gb"
                      id="ramUsageChart"
                    />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">CPU Usage</h1>
                  <div class="flex-1">
                    <Chart
                      data={currentCpuUsage()}
                      suffix="%"
                      id="cpuUsageChart"
                    />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">Disk Usage</h1>
                  <div class="flex-1">
                    <Chart
                      data={currentDiskUsage()}
                      suffix="gb"
                      id="diskUsageChart"
                    />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">Load Avg.</h1>
                  <div class="flex-1">
                    <Chart
                      data={currentLoadAvg()}
                      suffix="%"
                      id="loadAvgChart"
                    />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg">Network I/O</h1>
                  <p class="text-muted-foreground text-sm mb-2">
                    Green: In, Blue: Out
                  </p>
                  <div class="flex-1">
                    <Chart
                      data={currentRx()}
                      data2={currentTx()}
                      suffix="mb/s"
                      id="networkChart"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </main>
  );
}
