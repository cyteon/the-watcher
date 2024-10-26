import { createSignal, onMount, Show, createMemo } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { Meta } from "@solidjs/meta";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export default function Index() {
  const [data, setData] = createSignal({});

  const [visibleHeartbeats, setVisibleHeartbeats] = createSignal(50);
  const [infoLabels, setInfoLabels] = createSignal({});

  const timeString = (time) => {
    return new Date(
      new Date(time).getTime() - new Date(time).getTimezoneOffset() * 60000,
    ).toLocaleString();
  };

  onMount(() => {
    const updateScreenSize = () => {
      if (window.innerWidth >= 1400) {
        setVisibleHeartbeats(50);
      } else if (window.innerWidth >= 1200) {
        setVisibleHeartbeats(40);
      } else {
        setVisibleHeartbeats(30);
      }
    };

    window.addEventListener("resize", updateScreenSize);
    updateScreenSize();

    fetch("/api/data")
      .then((res) => res.json())
      .then((data) => setData(data));

    setInterval(() => {
      fetch("/api/data")
        .then((res) => res.json())
        .then((data) => setData(data));
    }, 60000);

    return () => window.removeEventListener("resize", updateScreenSize);
  });

  return (
    <>
      <Show when={data()?.title}>
        <Meta property="og:title" content={data().title} />
        <Meta property="og:description" content={data().description} />
        <Meta property="twitter:title" content={data().title} />
        <Meta property="twitter:description" content={data().description} />
      </Show>
      <main class="h-screen w-full flex flex-col items-center">
        <div class="mt-10 inline-block">
          <h1
            class="text-7xl font-bold gradient text-center"
            innerHTML={data().title}
          ></h1>
          <p class="text-2xl text-center" innerHTML={data().description}></p>

          <Show when={data().alert?.show}>
            <Alert class="mt-8">
              <AlertTitle class="text-lg font-bold">
                {data().alert?.title}
              </AlertTitle>
              <AlertDescription>{data().alert?.description}</AlertDescription>
            </Alert>
          </Show>
        </div>

        <div class="mt-10 w-[90%] md:w-1/2 ">
          <Show when={data().monitors?.length == 0}>
            <p class="text-center">No monitors found</p>
          </Show>
          <Show when={data().monitors?.length > 0}>
            <div class="flex flex-col w-full h-full">
              <Badge variant="outline" class="ml-auto bg-background">
                <span class="h-3 w-3 rounded-full bg-green-400 mr-1"></span>
                <span class="mt-[3px]">Online</span>
                <span class="h-3 w-3 rounded-full bg-yellow-200 ml-2 mr-1"></span>{" "}
                <span class="mt-[3px]">Degraded</span>
                <span class="h-3 w-3 rounded-full bg-red-400 ml-2 mr-1"></span>{" "}
                <span class="mt-[3px]">Down</span>
                <span class="h-3 w-3 rounded-full bg-gray-400 ml-2 mr-1"></span>{" "}
                <span class="mt-[3px]">Paused</span>
              </Badge>
              <div class="mt-2 border-[1px] border-border rounded-lg bg-background h-full">
                {data().monitors?.map((monitor, index) => (
                  <div
                    class={`flex p-5 flex-col lg:flex-row ${
                      index !== data().monitors.length - 1
                        ? "border-b-[1px]"
                        : ""
                    }`}
                  >
                    <div class="my-auto">
                      <div class="flex items-center">
                        <Show when={monitor.heartbeats[0]?.status == "up"}>
                          <span class="bg-green-400 mr-2 rounded-full h-5 w-5"></span>
                        </Show>
                        <Show when={monitor.heartbeats[0]?.status == "paused"}>
                          <span class="bg-gray-400 mr-2 rounded-full h-5 w-5"></span>
                        </Show>
                        <Show when={monitor.heartbeats[0]?.status == "down"}>
                          <span class="bg-red-400 mr-2 rounded-full h-5 w-5"></span>
                        </Show>
                        <Show
                          when={monitor.heartbeats[0]?.status == "degraded"}
                        >
                          <span class="bg-yellow-200 mr-2 rounded-full h-5 w-5"></span>
                        </Show>
                        <h1 class="font-bold text-lg mt-1">{monitor.name}</h1>
                      </div>
                      <a href={"/monitor/" + monitor.id} class="text-sm">
                        More info
                      </a>
                    </div>
                    <div class="ml-auto flex flex-col min-h-4">
                      <div class="self-end">
                        <Show when={monitor.avg_ping}>
                          <Badge class="self-end mr-2 w-fit rounded-xl">
                            Avg: {monitor.avg_ping?.toFixed(0)}ms
                          </Badge>
                        </Show>
                        <Badge class="self-end mr-2 w-fit rounded-xl">
                          {monitor.heartbeats[0]?.ping}ms
                        </Badge>
                        <Badge class="self-end w-fit rounded-xl">
                          {monitor.uptime
                            ? monitor.uptime?.toFixed(1) + "%"
                            : "?"}
                        </Badge>
                      </div>
                      <div class="flex justify-end">
                        {monitor.heartbeats
                          ?.slice(0, visibleHeartbeats())
                          .toReversed()
                          .map((ping) => (
                            <div
                              class="mt-1 min-h-8"
                              onMouseOver={() => {
                                setInfoLabels({
                                  [monitor.id.toString()]: ping,
                                });
                              }}
                              onMouseLeave={() => {
                                setInfoLabels({});
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
                        <Show when={infoLabels()[monitor.id.toString()]}>
                          <Show
                            when={
                              infoLabels()[monitor.id.toString()].status == "up"
                            }
                          >
                            <p class="text-sm mt-1 text-green-400">{`${timeString(infoLabels()[monitor.id.toString()].time)} - ${infoLabels()[monitor.id.toString()].ping}ms`}</p>
                          </Show>
                          <Show
                            when={
                              infoLabels()[monitor.id.toString()].status ==
                              "degraded"
                            }
                          >
                            <p class="text-sm mt-1 text-yellow-200">{`${timeString(infoLabels()[monitor.id.toString()].time)} - ${infoLabels()[monitor.id.toString()].ping}ms`}</p>
                          </Show>
                          <Show
                            when={
                              infoLabels()[monitor.id.toString()].status ==
                              "down"
                            }
                          >
                            <p class="text-sm mt-1 text-red-400">{`${timeString(infoLabels()[monitor.id.toString()].time)} -
                            ${infoLabels()[monitor.id.toString()].code != 0 ? "Status: " + infoLabels()[monitor.id.toString()].code : "Down"}`}</p>
                          </Show>
                          <Show
                            when={
                              infoLabels()[monitor.id.toString()].status ==
                              "paused"
                            }
                          >
                            <p class="text-sm mt-1 text-gray-400">{`${timeString(infoLabels()[monitor.id.toString()].time)} - Paused`}</p>
                          </Show>
                        </Show>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Show>
        </div>
        <div class="mt-auto">
          <footer
            class="mt-6 mb-2 text-center text-muted-foreground"
            innerHTML={data().footer}
          ></footer>
        </div>
      </main>
    </>
  );
}
