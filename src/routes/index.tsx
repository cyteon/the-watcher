import { createSignal, onMount, Show, createMemo } from "solid-js";
import { Badge } from "~/components/ui/badge";

function calculateUptime(heartbeats) {
  const total = heartbeats.filter((ping) => ping.status != "paused").length;
  const up = heartbeats.filter((ping) => ping.status == "up").length;
  const result = ((up / total) * 100).toFixed(2);

  if (isNaN(result)) {
    return "?";
  } else {
    return `${result}%`;
  }
}
export default function Index() {
  const [data, setData] = createSignal({});

  const [visibleHeartbeats, setVisibleHeartbeats] = createSignal(50);
  const [infoLabels, setInfoLabels] = createSignal({});

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
    <main class="h-screen w-full flex flex-col items-center">
      <div class="mt-10 inline-block">
        <h1
          class="text-7xl font-bold gradient text-center"
          innerHTML={data().title}
        ></h1>
        <p class="text-2xl text-center" innerHTML={data().description}></p>
      </div>
      <div class="mt-20 w-[90%] md:w-1/2 h-full">
        <Show when={data().monitors?.length == 0}>
          <p class="text-center">No monitors found</p>
        </Show>
        <Show when={data().monitors?.length > 0}>
          <div class="flex flex-col w-full h-full">
            <div class="mt-2 border-[1px] border-border rounded-lg bg-background">
              {data().monitors?.map((monitor, index) => (
                <div
                  class={`flex p-5 flex-col lg:flex-row ${
                    index !== data().monitors.length - 1 ? "border-b-[1px]" : ""
                  }`}
                >
                  <div class="flex items-center">
                    <Show when={monitor.heartbeats[0]?.status == "up"}>
                      <span class="bg-green-400 mr-2 rounded-full h-6 w-6"></span>
                    </Show>
                    <Show when={monitor.heartbeats[0]?.status == "paused"}>
                      <span class="bg-gray-400 mr-2 rounded-full h-6 w-6"></span>
                    </Show>
                    <Show when={monitor.heartbeats[0]?.status == "down"}>
                      <span class="bg-red-400 mr-2 rounded-full h-6 w-6"></span>
                    </Show>
                    <h1 class="font-bold text-lg mt-1">{monitor.name}</h1>
                  </div>
                  <div class="ml-auto flex flex-col min-h-4">
                    <div class="self-end">
                      <Badge class="self-end mr-2 w-fit rounded-xl">
                        {monitor.heartbeats[0]?.ping}ms
                      </Badge>
                      <Badge class="self-end w-fit rounded-xl">
                        {calculateUptime(monitor.heartbeats)}
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
                                [monitor.unique_id]: ping,
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
                            <Show when={ping.status == "down"}>
                              <div class="w-1 min-h-4 h-full mx-0.5 rounded-full bg-red-400"></div>
                            </Show>
                          </div>
                        ))}
                    </div>
                    <div class="min-h-[25px]">
                      <Show when={infoLabels()[monitor.unique_id]}>
                        <Show
                          when={infoLabels()[monitor.unique_id].status == "up"}
                        >
                          <p class="text-sm mt-1 text-green-400">{`${infoLabels()[monitor.unique_id].time} - ${infoLabels()[monitor.unique_id].ping}ms`}</p>
                        </Show>
                        <Show
                          when={
                            infoLabels()[monitor.unique_id].status == "down"
                          }
                        >
                          <p class="text-sm mt-1 text-red-400">{`${infoLabels()[monitor.unique_id].time} -
                            ${infoLabels()[monitor.unique_id].code != 0 ? "Status: " + infoLabels()[monitor.unique_id].code : "Down"}`}</p>
                        </Show>
                        <Show
                          when={
                            infoLabels()[monitor.unique_id].status == "paused"
                          }
                        >
                          <p class="text-sm mt-1 text-gray-400">{`${infoLabels()[monitor.unique_id].time} - Paused`}</p>
                        </Show>
                      </Show>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div class="mt-auto">
              <footer
                class="mt-6 mb-2 text-center text-muted-foreground"
                innerHTML={data().footer}
              ></footer>
            </div>
          </div>
        </Show>
      </div>
    </main>
  );
}
