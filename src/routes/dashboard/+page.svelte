<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import Chart from "$lib/components/Chart.svelte";
    import state from "$lib/state.svelte";
    import { onMount } from "svelte";
    import { getCookie } from "typescript-cookie";

    let monitors: any[] = [];
    let selectedMonitor: any = null;
    let hideList: boolean = false;
    let isPhone: boolean = false;
    let view: string = "dashboard";
    
    onMount(async () => {
        if (!state.user && !state.loading) {
            goto("/login");
        }

        const res = await fetch("/api/monitors", {
            headers: {
                "Authorization": `Bearer ${getCookie("token")}`,
            },
        });

        if (!res.ok) {
            console.error("Failed to fetch monitors:", res.statusText);
            return;
        }

        monitors = await res.json();
        isPhone = window.innerWidth < 768;
    });
</script>

<div class="flex w-full h-screen flex-col p-2">
    <div class="flex mx-auto mt-2">
        <button 
            class={`${view === "dashboard" ? "underline" : ""} text-neutral-300`}
            on:click={() => { view = "dashboard"; hideList = false; selectedMonitor = null; }}
        >dashboard</button>
        <p class="mx-2 text-neutral-500">\</p>
        <button
            class={`${view === "statusPages" ? "underline" : ""} text-neutral-300`}
            on:click={() => { view = "statusPages"; hideList = true; selectedMonitor = null; }}
        >status pages</button>
    </div>

    <div class="flex w-full h-full gap-4 p-4">
        {#if !hideList}
            <div class="w-full md:w-1/3 h-full border border-neutral-800 rounded-md p-4 flex flex-col">
                <div class="flex">
                    <h1 class="text-2xl font-bold text-neutral-300">Monitors</h1>
                    <a href="/dashboard/monitors/new" class="ml-auto underline text-sm text-neutral-300 my-auto">new monitor →</a>
                </div>

                {#each monitors as monitor}
                    <button 
                        class="flex w-full p-4 border border-neutral-700 rounded-md mt-2 hover:bg-neutral-800 cursor-pointer" 
                        on:click={() => { selectedMonitor = monitor; view = "dashboard"; hideList = isPhone; }}
                    >
                        <span class={`
                            my-auto mr-2 px-2 text-sm rounded-md text-black my-auto
                            ${monitor.heartbeats[monitor.heartbeats.length - 1]?.status === "up" ? "bg-green-400" : "bg-red-400"}
                        `}>
                            {(monitor.heartbeats.filter(h => h.status === "up").length / monitor.heartbeats.length * 100 || 0).toFixed(2)}%
                        </span>
                        <h1 class="text-xl font-semibold text-neutral-300">{monitor.name}</h1>
                        <div class="ml-auto my-auto space-x-1 flex">
                            {#each monitor.heartbeats.slice(-10) as heartbeat}
                                {#if heartbeat.status === "up"}
                                    <div class="h-6 w-2 rounded-md bg-green-400"></div>
                                {:else if heartbeat.status === "down"}
                                    <span class="h-6 w-2 rounded-md bg-red-400"></span>
                                {/if}
                            {/each}
                        </div>
                    </button>
                {/each}
            </div>
        {/if}

        {#if view === "dashboard" && !isPhone && !selectedMonitor}
            <div class="w-full border border-neutral-800 rounded-md p-4 flex">
                <p>
                    online monitors: <span class="text-green-400 font-bold">
                        {monitors.filter(m => m.heartbeats[m.heartbeats.length - 1]?.status === "up").length}
                    </span>
                </p>

                <p class="mx-2 text-neutral-500">—</p>

                <p>
                    offline monitors: <span class="text-red-400 font-bold">
                        {monitors.filter(m => m.heartbeats[m.heartbeats.length - 1]?.status === "down").length}
                    </span>
                </p>

                <p class="mx-2 text-neutral-500">—</p>

                <p>
                    total monitors: <span class="text-neutral-300 font-bold">{monitors.length}</span>
                </p>
            </div>
        {:else if view === "dashboard" && selectedMonitor}
            <div class="w-full h-full border border-neutral-800 rounded-md p-4 flex flex-col">
                <h1 class="text-2xl font-bold text-neutral-300">{selectedMonitor.name}</h1>
                <a href={selectedMonitor.url} class="text-sm text-blue-300 underline mb-4" target="_blank">
                    {selectedMonitor.url}
                </a>

                <div class="p-2 flex-col border border-neutral-700 rounded-md">
                    <div class="flex">
                        <div class="flex gap-1">
                            {#each Array(
                                isPhone ? 12 : 50
                            ).fill(0).map((_, i) => i).reverse() as index}
                                {#if index < selectedMonitor.heartbeats.length}
                                    {#if selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1 - index]?.status === "up"}
                                        <div class="h-8 w-3 rounded-md bg-green-400"></div>
                                    {:else if selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1 - index]?.status === "down"}
                                        <span class="h-8 w-3 rounded-md bg-red-400"></span>
                                    {/if}
                                {:else}
                                    <div class="h-8 w-3 rounded-md bg-neutral-700"></div>
                                {/if}
                            {/each}
                        </div>
                        <span class={`
                            mx-auto h-min py-1 px-4 my-auto rounded-md text-black
                            ${selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1]?.status === "up" ? "bg-green-400" : "bg-red-400"}
                        `}>
                            {selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1]?.status === "up" ? "Online" : "Down"}
                        </span>
                    </div>
                    <p class="text-neutral-400 text-sm mt-2">Checked every {selectedMonitor.heartbeat_interval} seconds</p>
                </div>

                <div 
                    class="p-2 flex-col border border-neutral-700 rounded-md mt-4 h-96 w-full"
                >
                    <Chart data={
                        selectedMonitor.heartbeats.map(h => ({
                            time: new Date(h.timestamp).getTime(),
                            value: h.response_time,
                        }))
                    } />
                </div>
            </div>
        {:else if view === "statusPages"}
            <div class="w-full h-full border border-neutral-800 rounded-md p-4 flex flex-col">status pages</div>
        {/if}
    </div>
</div>