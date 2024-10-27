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

  const [newName, setNewName] = createSignal("");
  const [newURL, setNewURL] = createSignal("");
  const [newInterval, setNewInterval] = createSignal(1);
  const [newPublic, setNewPublic] = createSignal(false);
  const [newWebhook, setNewWebhook] = createSignal("");

  const [username, setUsername] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [oldPassword, setOldPassword] = createSignal("");

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
              value: ping.ram_usage / 1000000000 || 0,
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
              value: ping.disk_usage / 1000000000 || 0,
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
      }
    }
  });

  onMount(() => {
    const updateScreenSize = () => {
      if (window.innerWidth >= 1400) {
        setVisibleHeartbeatsSmall(15);
        setVisibleHeartbeatsBig(100);
      } else if (window.innerWidth >= 1200) {
        setVisibleHeartbeatsSmall(10);
        setVisibleHeartbeatsBig(50);
      } else {
        setVisibleHeartbeatsSmall(5);
        setVisibleHeartbeatsBig(25);
      }
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
      <div class="bg-background border-border border-[1px] p-3 m-3 rounded-lg flex flex-col">
        {data().monitors?.map((monitor, index) => (
          <button
            onClick={() => {
              setCurrentMonitor(monitor);
            }}
            class={`${
              index < visibleHeartbeatsSmall() ? "" : "hidden"
            } flex items-center justify-between border-[1px] w-full border-border p-3 mb-1 rounded-md `}
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
          class="w-full mt-1"
          onClick={() => (window.location.href = "/dash/new")}
        >
          + Add Monitor
        </Button>
        <div class="mt-auto">
          <AlertDialog>
            <AlertDialogTrigger as={Button}>
              <span class="mt-1 text-[18px]">Profile</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle class="text-2xl">
                  Edit Profile
                </AlertDialogTitle>
              </AlertDialogHeader>
              To change password enter your old password and new password.
              Changing username does not require old password.
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
              <TextFieldRoot class="mb-4">
                <TextFieldLabel>Old Password</TextFieldLabel>
                <TextField
                  class="w-full"
                  type="password"
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </TextFieldRoot>
              <AlertDialogFooter>
                <AlertDialogAction>
                  <span class="text-[18px] mt-1">Cancel</span>
                </AlertDialogAction>
                <AlertDialogAction onClick={() => logOut()}>
                  <span class="text-[18px] mt-1">Log Out</span>
                </AlertDialogAction>
                <AlertDialogAction onClick={() => editUser()}>
                  <span class="text-[18px] mt-1">Save</span>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Show when={currentMonitor()}>
        <div class="bg-background border-border w-full border-[1px] p-3 m-3 rounded-lg flex flex-col h-[calc(100vh-24px)]">
          <div class="flex-none">
            <Show
              when={
                currentMonitor()?.heartbeats[0]?.status == "up" &&
                currentMonitor()?.paused == false
              }
            >
              <Badge
                variant={"noHover"}
                class="w-fit rounded-lg bg-green-400 my-auto mr-2 p-1"
              >
                <span class="mt-1 text-[1rem]">Online</span>
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
                class="w-fit rounded-lg bg-gray-400 my-auto mr-2 p-1"
              >
                <span class="mt-1 text-[1rem]">Paused</span>
              </Badge>
            </Show>
            <Show when={currentMonitor()?.heartbeats[0]?.status == "degraded"}>
              <Badge
                variant={"noHover"}
                class="w-fit rounded-lg bg-yellow-200 my-auto mr-2 p-1"
              >
                <span class="mt-1 text-[1rem] ">Degraded</span>
              </Badge>
            </Show>
            <Show when={currentMonitor()?.heartbeats[0]?.status == "down"}>
              <Badge
                variant={"noHover"}
                class="w-fit rounded-lg bg-red-400 my-auto mr-2 p-1"
              >
                <span class="mt-1 text-[1rem] ">Offline</span>
              </Badge>
            </Show>

            <h1 class="text-3xl">{currentMonitor()?.name}</h1>
          </div>
          <a href={currentMonitor()?.url}>{currentMonitor()?.url}</a>
          <div class="my-3 flex">
            <Button class="mr-1" onClick={() => togglePaused()}>
              <span class="mt-1 text-lg">
                {currentMonitor()?.paused ? "Unpause" : "Pause"}
              </span>
            </Button>
            <div class="mr-1">
              <AlertDialog>
                <AlertDialogTrigger as={Button}>
                  <span class="mt-1 text-[18px]">Edit</span>
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
                      --interval={newInterval()}
                    </code>
                  </Show>
                  <Show when={currentMonitor()?.type != "Server-Side Agent"}>
                    <TextFieldRoot class="mb-4">
                      <TextFieldLabel>Monitor URL</TextFieldLabel>
                      <TextField
                        class="w-full"
                        value={currentMonitor()?.url}
                        onChange={(e) => setNewURL(e.target.value)}
                      />
                    </TextFieldRoot>
                  </Show>
                  <TextFieldRoot class="mb-4">
                    <TextFieldLabel>Monitor Interval</TextFieldLabel>
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
                    <CheckboxLabel class="text-sm ml-1 mt-1 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Public Monitor
                    </CheckboxLabel>
                  </Checkbox>

                  <AlertDialogFooter>
                    <AlertDialogAction>
                      <span class="text-[18px] mt-1">Cancel</span>
                    </AlertDialogAction>
                    <AlertDialogAction onClick={() => editMonitor()}>
                      <span class="text-[18px] mt-1">Save Changes</span>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                as={Button}
                class="bg-red-400 hover:bg-red-400"
              >
                <span class="mt-1 text-[18px]">Delete</span>
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
                  <AlertDialogAction>
                    <span class="text-[18px] mt-1">Cancel</span>
                  </AlertDialogAction>
                  <AlertDialogAction
                    class="bg-red-400"
                    onClick={() => deleteMonitor()}
                  >
                    <span class="text-[18px] mt-1">Continue</span>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div class="p-3 border-border border-[1px] mt-2 rounded-md">
            <div class="self-end">
              <Show when={currentMonitor()?.avg_ping}>
                <Badge class="self-end mr-2 w-fit rounded-xl">
                  Avg: {currentMonitor()?.avg_ping?.toFixed(0)}ms
                </Badge>
              </Show>
              <Badge class="self-end mr-2 w-fit rounded-xl">
                {currentMonitor()?.heartbeats[0]?.ping}ms
              </Badge>
              <Badge class="self-end w-fit rounded-xl">
                {currentMonitor()?.uptime
                  ? currentMonitor()?.uptime?.toFixed(1) + "%"
                  : "?"}
              </Badge>
            </div>
            <div class="w-fit">
              <div class="flex">
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
              <div class="flex mt-1">
                <Show when={currentPing()}>
                  <Show
                    when={
                      currentPing()?.status == "up" &&
                      currentMonitor()?.type != "Server-Side Agent"
                    }
                  >
                    <p class="text-sm text-green-400">{`${currentPing()?.time} - Status: ${currentPing()?.code} - ${currentPing()?.ping}ms`}</p>
                  </Show>
                  <Show
                    when={
                      currentPing()?.status == "up" &&
                      currentMonitor()?.type == "Server-Side Agent"
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
              <Chart data={currentChartData()} suffix="ms" />
            </div>
          </Show>

          <Show when={currentMonitor()?.type == "Server-Side Agent"}>
            <div class="flex mt-2 flex-wrap">
              <div class="border border-border p-5 text-lg rounded-lg mr-3 mt-1">
                <p>Ram Usage</p>
                <p>
                  {(
                    currentMonitor()?.heartbeats[0]?.ram_usage / 1000000000
                  ).toFixed(2)}
                  GB /{" "}
                  {(
                    currentMonitor()?.heartbeats[0]?.ram_max / 1000000000
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
                    currentMonitor()?.heartbeats[0]?.disk_usage / 1000000000
                  ).toFixed(2)}
                  GB /
                  {(
                    currentMonitor()?.heartbeats[0]?.disk_capacity / 1000000000
                  ).toFixed(2)}
                  GB
                </p>
              </div>
              <div class="border border-border p-5 text-lg rounded-lg mt-1">
                <p>Load Average</p>
                <p>{currentMonitor()?.heartbeats[0]?.load_avg}%</p>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto mt-3">
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">RAM Usage</h1>
                  <div class="flex-1">
                    <Chart data={currentRamUsage()} suffix="gb" />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">CPU Usage</h1>
                  <div class="flex-1">
                    <Chart data={currentCpuUsage()} suffix="%" />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">Disk Usage</h1>
                  <div class="flex-1">
                    <Chart data={currentDiskUsage()} suffix="gb" />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">Load Avg.</h1>
                  <div class="flex-1">
                    <Chart data={currentLoadAvg()} suffix="%" />
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
