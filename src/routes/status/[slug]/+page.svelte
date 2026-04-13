<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    export let data: { slug: string };

    let statusPage = {
        name: "",
        slug: data.slug,
        description: "",
        monitors: [],
    };

    let containerWidth = 0;
    $: heartbeatCount = containerWidth ? Math.floor((containerWidth - 50) / 16) : 30;

    onMount(async () => {
        try {
            const res = await fetch(`/api/status_pages/${data.slug}`);

            if (!res.ok) {
                goto("/dashboard");
                return;
            }

            statusPage = await res.json();
        } catch (error) {
            console.error("Error fetching status page:", error);
        }
    });
</script>

<div class="w-full h-screen flex flex-col px-2">
    <a href="/" class="absolute right-4 top-2 text-sm text-neutral-300 hover:underline">back home →</a>

    <div class="m-auto w-full md:w-1/2 flex flex-col" bind:clientWidth={containerWidth}>
        <h1 class="text-3xl font-bold text-neutral-300 w-full text-center mb-2">{statusPage.name}</h1>

        <p class="text-sm text-neutral-400 text-center mb-4">{statusPage.description}</p>

        <div class="flex flex-col">
            {#each statusPage.monitors as monitor}
                <div class="flex flex-col flex-1 p-2 border rounded-md my-2">
                    <div class="flex mb-2">
                        <h2 class="text-2xl font-semibold text-neutral-300">{monitor.name}</h2>

                        <div class="flex ml-auto space-x-2 my-auto">
                            <span class={`
                                px-2 rounded-md text-black my-auto
                                ${monitor.heartbeats[monitor.heartbeats.length - 1]?.status === "up" ? "bg-green-400" : "bg-red-400"}
                            `}>
                                {(monitor.heartbeats.filter(h => h.status === "up").length / monitor.heartbeats.length * 100 || 0).toFixed(2)}%
                            </span>

                            <span class="text-neutral-300 my-auto border rounded-md px-2">
                                {monitor.heartbeats.length > 0 ? monitor.heartbeats[monitor.heartbeats.length - 1]?.response_time + "ms" : "N/A"}
                            </span>
                        </div>
                    </div>

                    <div class="p-2 flex-col border rounded-md">
                        <div class="flex flex-col">
                            <div class="flex gap-1">
                                {#each Array(heartbeatCount).fill(0).map((_, i) => i).reverse() as index}
                                    {#if index < monitor.heartbeats.length}
                                        {#if monitor.heartbeats[monitor.heartbeats.length - 1 - index]?.status === "up"}
                                            <div class="h-8 flex-1 rounded-md bg-green-400"></div>
                                        {:else if monitor.heartbeats[monitor.heartbeats.length - 1 - index]?.status === "down"}
                                            <span class="h-8 flex-1 rounded-md bg-red-400"></span>
                                        {/if}
                                    {:else}
                                        <div class="h-8 flex-1 rounded-md bg-neutral-700"></div>
                                    {/if}
                                {/each}
                            </div>
                            <div class="flex">
                                <p class="text-neutral-400 text-sm mt-2">Checked every {monitor.heartbeat_interval} seconds</p>
                                <p class="text-neutral-400 text-sm mt-2 ml-auto">Now</p>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>