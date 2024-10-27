import { Meta } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import Chart from "~/components/Chart";
import { Badge } from "~/components/ui/badge";

function getTime(time: string) {
  return (
    new Date(
      new Date(time).getTime() - new Date(time).getTimezoneOffset() * 60000 * 2,
    ).getTime() / 1000
  );
}

export default function Index() {
  const { slug } = useParams();
  const [visibleHeartbeats, setVisibleHeartbeats] = createSignal(50);
  const [data, setData] = createSignal({ heartbeats: [] });
  const [infoLabel, setInfoLabel] = createSignal("");
  const [chartData, setChartData] = createSignal([]);

  const [ramUsage, setRamUsage] = createSignal([]);
  const [cpuUsage, setCpuUsage] = createSignal([]);
  const [diskUsage, setDiskUsage] = createSignal([]);
  const [loadAvg, setLoadAvg] = createSignal([]);

  const timeString = (time) => {
    return new Date(
      new Date(time).getTime() - new Date(time).getTimezoneOffset() * 60000,
    ).toLocaleString();
  };

  onMount(async () => {
    const updateScreenSize = () => {
      if (window.innerWidth >= 1400) {
        setVisibleHeartbeats(100);
      } else if (window.innerWidth >= 1200) {
        setVisibleHeartbeats(60);
      } else {
        setVisibleHeartbeats(30);
      }
    };

    window.addEventListener("resize", updateScreenSize);
    updateScreenSize();

    const res = await fetch(`/api/monitors/${slug}`);

    if (res.ok) {
      const data = await res.json();
      setData(data);

      setChartData([]);

      var heartBeats = [];
      var lastTimes = new Set();

      data.heartbeats.toReversed().map((heartbeat) => {
        const time = new Date(heartbeat.time).getTime();

        if (lastTimes.has(time)) {
          return;
        }

        heartBeats.push({
          time:
            new Date(
              new Date(time).getTime() -
                new Date(time).getTimezoneOffset() * 60000 * 2,
            ).getTime() / 1000,
          value: heartbeat.ping,
        });

        lastTimes.add(time);
      });

      setChartData(heartBeats);

      setRamUsage(
        data!.heartbeats!.toReversed().map((ping) => ({
          value: ping.ram_usage / 1000000000 || 0,
          time: getTime(ping.time),
        })),
      );

      setCpuUsage(
        data!.heartbeats!.toReversed().map((ping) => ({
          value: ping.cpu_usage || 0,
          time: getTime(ping.time),
        })),
      );

      setDiskUsage(
        data!.heartbeats!.toReversed().map((ping) => ({
          value: ping.disk_usage / 1000000000 || 0,
          time: getTime(ping.time),
        })),
      );

      setLoadAvg(
        data!.heartbeats!.toReversed().map((ping) => ({
          value: ping.load_avg || 0,
          time: getTime(ping.time),
        })),
      );
    } else {
      window.location.href = "/";
    }
  });

  return (
    <>
      <Show when={data()?.name}>
        <Meta property="og:title" content={data()?.name} />
        <Meta property="twitter:title" content={data().name} />
      </Show>
      <main class="h-screen w-full flex flex-col items-center">
        <a
          href="/"
          class="absolute left-0 top-0 m-3 fill-black bg-foreground p-1 rounded-full"
        >
          <svg
            height="32px"
            id="Layer_1"
            style="enable-background:new 0 0 512 512;"
            version="1.1"
            viewBox="0 0 512 512"
            width="32px"
            xml:space="preserve"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
          >
            <polygon points="352,128.4 319.7,96 160,256 160,256 160,256 319.7,416 352,383.6 224.7,256 " />
          </svg>
        </a>
        <div>
          <div class="flex p-5 flex-col lg:flex-row border bg-background mt-10 rounded-md">
            <div class="my-auto">
              <div class="flex items-center">
                <Show when={data()?.heartbeats[0]?.status == "up"}>
                  <span class="bg-green-400 mr-2 rounded-full h-5 w-5"></span>
                </Show>
                <Show when={data()?.heartbeats[0]?.status == "paused"}>
                  <span class="bg-gray-400 mr-2 rounded-full h-5 w-5"></span>
                </Show>
                <Show when={data()?.heartbeats[0]?.status == "down"}>
                  <span class="bg-red-400 mr-2 rounded-full h-5 w-5"></span>
                </Show>
                <Show when={data()?.heartbeats[0]?.status == "degraded"}>
                  <span class="bg-yellow-200 mr-2 rounded-full h-5 w-5"></span>
                </Show>
                <h1 class="font-bold text-lg mt-1">{data()?.name}</h1>
              </div>
            </div>
            <div class="ml-auto flex flex-col min-h-4">
              <div class="self-end">
                <Show when={data()?.avg_ping}>
                  <Badge class="self-end mr-2 w-fit rounded-xl">
                    Avg: {data()?.avg_ping?.toFixed(0)}ms
                  </Badge>
                </Show>
                <Show when={data()?.heartbeats[0]?.ping}>
                  <Badge class="self-end mr-2 w-fit rounded-xl">
                    {data()?.heartbeats[0]?.ping}ms
                  </Badge>
                </Show>
                <Badge class="self-end w-fit rounded-xl">
                  {data()?.uptime ? data()?.uptime?.toFixed(1) + "%" : "?"}
                </Badge>
              </div>
              <div class="flex justify-end">
                {data()
                  ?.heartbeats?.slice(0, visibleHeartbeats())
                  .toReversed()
                  .map((ping) => (
                    <div
                      class="mt-1 min-h-8"
                      onMouseOver={() => {
                        setInfoLabel(ping);
                      }}
                      onMouseLeave={() => {
                        setInfoLabel("");
                      }}
                    >
                      <Show when={ping.status == "up"}>
                        <div class="w-1 h-full mx-0.5 rounded-full bg-green-400"></div>
                      </Show>
                      <Show when={ping.status == "paused"}>
                        <div class="w-1 min-h-4 h-full mx-0.5 rounded-full bg-gray-400"></div>
                      </Show>
                      <Show when={ping.status == "degraded"}>
                        <div class="w-1 min-h-4 h-full mx-0.5 rounded-full bg-yellow-200"></div>
                      </Show>
                      <Show when={ping.status == "down"}>
                        <div class="w-1 min-h-4 h-full mx-0.5 rounded-full bg-red-400"></div>
                      </Show>
                    </div>
                  ))}
              </div>
              <div class="min-h-[25px]">
                <Show when={infoLabel()}>
                  <Show when={infoLabel().status == "up"}>
                    <p class="text-sm mt-1 text-green-400">{`${timeString(infoLabel().time)} - ${infoLabel().ping}ms`}</p>
                  </Show>
                  <Show when={infoLabel().status == "degraded"}>
                    <p class="text-sm mt-1 text-yellow-200">{`${timeString(infoLabel().time)} - ${infoLabel().ping}ms`}</p>
                  </Show>
                  <Show when={infoLabel().status == "down"}>
                    <p class="text-sm mt-1 text-red-400">{`${timeString(infoLabel().time)} -
                  ${infoLabel().code != 0 ? "Status: " + infoLabel().code : "Down"}`}</p>
                  </Show>
                  <Show when={infoLabel().status == "paused"}>
                    <p class="text-sm mt-1 text-gray-400">{`${timeString(infoLabel().time)} - Paused`}</p>
                  </Show>
                </Show>
              </div>
            </div>
          </div>
          <Show when={data()?.type != "Server-Side Agent"}>
            <div class="p-3 border h-64 mt-3 flex-grow bg-background rounded-md">
              <Chart data={chartData()} suffix="ms" />
            </div>
          </Show>

          <Show when={data()?.type == "Server-Side Agent"}>
            <div class="flex mt-2 flex-wrap">
              <div class="stat">
                <p>Ram Usage</p>
                <p>
                  {(data()?.heartbeats[0]?.ram_usage / 1000000000).toFixed(2)}
                  GB /{" "}
                  {(data()?.heartbeats[0]?.ram_max / 1000000000).toFixed(2)}
                  GB
                </p>
              </div>
              <div class="stat">
                <p>CPU Usage</p>
                <p>
                  {data()?.heartbeats[0]?.cpu_usage?.toFixed(2)}% of{" "}
                  {data()?.heartbeats[0]?.cpu_cores} cores
                </p>
              </div>
              <div class="stat">
                <p>Disk Usage</p>
                <p>
                  {(data()?.heartbeats[0]?.disk_usage / 1000000000).toFixed(2)}
                  GB /
                  {(data()?.heartbeats[0]?.disk_capacity / 1000000000).toFixed(
                    2,
                  )}
                  GB
                </p>
              </div>
              <div class="stat">
                <p>Load Average</p>
                <p>{data()?.heartbeats[0]?.load_avg}%</p>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto mt-3 bg-background">
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">RAM Usage</h1>
                  <div class="flex-1">
                    <Chart data={ramUsage()} suffix="gb" />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">CPU Usage</h1>
                  <div class="flex-1">
                    <Chart data={cpuUsage()} suffix="%" />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full mb-3">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">Disk Usage</h1>
                  <div class="flex-1">
                    <Chart data={diskUsage()} suffix="gb" />
                  </div>
                </div>
              </div>
              <div class="p-3 border rounded-md w-full">
                <div class="flex flex-col h-64">
                  <h1 class="text-lg mb-2">Load Avg.</h1>
                  <div class="flex-1">
                    <Chart data={loadAvg()} suffix="%" />
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
        <div class="mt-auto">
          <footer
            class="mt-6 mb-2 text-center text-muted-foreground"
            innerHTML={data()?.other?.footer}
          ></footer>
        </div>
      </main>
    </>
  );
}
