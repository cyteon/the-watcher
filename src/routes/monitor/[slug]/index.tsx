import { useParams } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import PingChart from "~/components/PingChart";
import { Badge } from "~/components/ui/badge";

export default function Index() {
  const { slug } = useParams();
  const [visibleHeartbeats, setVisibleHeartbeats] = createSignal(50);
  const [data, setData] = createSignal({ heartbeats: [] });
  const [infoLabel, setInfoLabel] = createSignal("");

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
    } else {
      window.location.href = "/";
    }
  });

  return (
    <main class="h-screen w-full flex flex-col items-center">
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
          <div class="ml-10 flex flex-col min-h-4">
            <div class="self-end">
              <Show when={data()?.avg_ping}>
                <Badge class="self-end mr-2 w-fit rounded-xl">
                  Avg: {data()?.avg_ping?.toFixed(0)}ms
                </Badge>
              </Show>
              <Badge class="self-end mr-2 w-fit rounded-xl">
                {data()?.heartbeats[0]?.ping}ms
              </Badge>
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
                  <p class="text-sm mt-1 text-green-400">{`${infoLabel().time} - ${infoLabel().ping}ms`}</p>
                </Show>
                <Show when={infoLabel().status == "degraded"}>
                  <p class="text-sm mt-1 text-yellow-200">{`${infoLabel().time} - ${infoLabel().ping}ms`}</p>
                </Show>
                <Show when={infoLabel().status == "down"}>
                  <p class="text-sm mt-1 text-red-400">{`${infoLabel().time} -
                  ${infoLabel().code != 0 ? "Status: " + infoLabel().code : "Down"}`}</p>
                </Show>
                <Show when={infoLabel().status == "paused"}>
                  <p class="text-sm mt-1 text-gray-400">{`${infoLabel().time} - Paused`}</p>
                </Show>
              </Show>
            </div>
          </div>
        </div>
        <div class="p-3 border h-64 mt-3 flex-grow bg-background rounded-md">
          <PingChart heartbeats={data()?.heartbeats} />
        </div>
      </div>
    </main>
  );
}
