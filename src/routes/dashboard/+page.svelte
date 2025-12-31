<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import Chart from "$lib/components/Chart.svelte";
    import state from "$lib/state.svelte";
    import { onMount } from "svelte";
    import { getCookie } from "typescript-cookie";

    let monitors: any[] = [];
    let statusPages: any[] = [];

    let selectedMonitor: any = null;
    let hideList: boolean = false;
    let isPhone: boolean = false;
    let view: string = "dashboard";
    
    let containerWidth = 0;
    $: heartbeatCount = containerWidth ? Math.floor((containerWidth - 150) / 16) : 30;

    onMount(async () => {
        if (!state.user && !state.loading) {
            goto("/login");
        }

        const res = await fetch("/api/admin/monitors", {
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

        const res2 = await fetch("/api/status_pages");

        if (!res2.ok) {
            console.error("Failed to fetch status pages:", res2.statusText);
            return;
        }

        statusPages = await res2.json();
    });

    async function deleteMonitor(monitorId: string) {
        if (!browser) return;

        if (!confirm("Are you sure you want to delete this monitor? This action cannot be undone.")) {
            return;
        }

        const res = await fetch(`/api/admin/monitors/${monitorId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${getCookie("token")}`,
            },
        });

        if (!res.ok) {
            alert("Failed to delete monitor: " + res.statusText);
            return;
        }

        monitors = monitors.filter(m => m.id !== monitorId);
        selectedMonitor = null;
        if (isPhone) {
            hideList = false;
        }
    }
    
    async function pauseUnpauseMonitor(monitorId: string, paused: boolean) {
        if (!browser) return;

        const res = await fetch(`/api/admin/monitors/${monitorId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${getCookie("token")}`,
            },
            body: JSON.stringify({ paused }),
        });

        if (!res.ok) {
            alert("Failed to update monitor: " + res.statusText);
            return;
        }

        monitors = monitors.map(m => m.id === monitorId ? { ...m, paused } : m);
        if (selectedMonitor && selectedMonitor.id === monitorId) {
            selectedMonitor.paused = paused;
        }
    }
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
            on:click={() => { view = "statusPages"; hideList = isPhone; selectedMonitor = null; }}
        >status pages</button>
    </div>

    <div class="flex w-full flex-1 min-h-0 gap-4 p-4 overflow-hidden">
        {#if !hideList}
            <div class="w-full md:w-1/3 border border-neutral-800 rounded-md p-4 flex flex-col overflow-y-auto min-h-0">
                <div class="flex">
                    <h1 class="text-2xl font-bold text-neutral-300">Monitors</h1>
                    <a href="/dashboard/monitors/new" class="ml-auto underline text-sm text-neutral-300 my-auto">new monitor →</a>
                </div>

                {#each monitors as monitor}
                    <button 
                        class="flex w-full p-4 border rounded-md mt-2 hover:bg-neutral-800 cursor-pointer" 
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
            <div class="w-full border border-neutral-800 rounded-md p-4 flex flex-col overflow-y-auto">
                <h1 class="text-2xl font-bold text-neutral-300">{selectedMonitor.name}</h1>
                <a href={selectedMonitor.url} class="text-blue-300 underline mb-2 w-fit" target="_blank">
                    {selectedMonitor.url}
                </a>

                <div class="flex mb-4 space-x-2">
                    {#if selectedMonitor.paused}
                        <button 
                            class="text-white px-4 py-2 rounded-md border hover:bg-neutral-800"
                            on:click={() => pauseUnpauseMonitor(selectedMonitor.id, false)}
                        >
                            Unpause Monitor
                        </button>
                    {:else}
                        <button 
                            class="text-white px-4 py-2 rounded-md border hover:bg-neutral-800"
                            on:click={() => pauseUnpauseMonitor(selectedMonitor.id, true)}
                        >
                            Pause Monitor
                        </button>
                    {/if}

                    <button 
                        class="text-red-400 px-4 py-2 rounded-md border hover:bg-neutral-800"
                        on:click={() => deleteMonitor(selectedMonitor.id)}
                    >
                        Delete Monitor
                    </button>
                </div>

                <div class="p-2 flex-col border rounded-md" bind:clientWidth={containerWidth}>
                    <div class="flex">
                        <div class="flex gap-1 w-full mr-1">
                            {#each Array(heartbeatCount).fill(0).map((_, i) => i).reverse() as index}
                                {#if index < selectedMonitor.heartbeats.length}
                                    {#if selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1 - index]?.status === "up"}
                                        <div class="h-8 flex-1 rounded-md bg-green-400"></div>
                                    {:else if selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1 - index]?.status === "down"}
                                        <span class="h-8 flex-1 rounded-md bg-red-400"></span>
                                    {/if}
                                {:else}
                                    <div class="h-8 flex-1 rounded-md bg-neutral-700"></div>
                                {/if}
                            {/each}
                        </div>

                        <span class={`
                            ml-auto h-min py-1 px-4 my-auto rounded-md text-black
                            ${selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1]?.status === "up" ? "bg-green-400" : "bg-red-400"}
                        `}>
                            {selectedMonitor.heartbeats[selectedMonitor.heartbeats.length - 1]?.status === "up" ? "Online" : "Down"}
                        </span>
                    </div>

                    <div class="flex">
                        <p class="text-neutral-400 text-sm mt-2">Checked every {selectedMonitor.heartbeat_interval} seconds</p>
                        <p class="text-neutral-400 text-sm mt-2 ml-auto">Now</p>
                    </div>
                </div>

                <div 
                    class="p-2 flex-col border rounded-md mt-4 h-72 w-full"
                >
                    <Chart data={
                        selectedMonitor.heartbeats.map(h => ({
                            time: new Date(h.timestamp).getTime(),
                            value: h.response_time,
                        }))
                    } />
                </div>

                <div class="mt-4 p-2 flex-col border rounded-md overflow-y-auto flex-1">
                    <h2 class="text-lg font-semibold text-neutral-300">History</h2>
                    <table class="w-full mt-2">
                        <thead>
                            <tr>
                                <th class="text-left text-neutral-400">Status</th>
                                <th class="text-left text-neutral-400">Time</th>
                                <th class="text-left text-neutral-400">Message</th>
                            </tr>
                        </thead>

                        <tbody>
                            {#each selectedMonitor.statusUpdates as update}
                                <tr>
                                    <td class="py-2">
                                        <span class={`px-2 py-1 rounded-md ${update.status === "up" ? "bg-green-400" : "bg-red-400"} text-black`}>
                                            {update.status}
                                        </span>
                                    </td>
                                    <td class="py-2 text-neutral-300">
                                        {new Date(update.timestamp * 1000).toDateString()} {new Date(update.timestamp * 1000).toLocaleTimeString()}
                                    </td>
                                    <td class="py-2 text-neutral-300">{update.message}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {:else if view === "statusPages"}
            <div class="w-full h-full border border-neutral-800 rounded-md p-4 flex flex-col overflow-y-auto min-h-0">
                <div class="flex">
                    <h1 class="text-2xl font-bold text-neutral-300">Status Pages</h1>

                    <a href="/dashboard/status_pages/new" class="ml-auto underline text-sm text-neutral-300 my-auto">new status page →</a>
                </div>

                {#each statusPages as page}
                    <div class="flex flex-col h-fit p-2 border rounded-md my-2">
                        <div class="flex">
                            <h2 class="text-lg font-semibold text-neutral-300">{page.name}</h2>
                            
                            <a href={`/dashboard/status_pages/edit/${page.slug}`} class="ml-auto my-auto text-sm text-neutral-300 hover:underline">
                                edit →
                            </a>
                        </div>

                        <p class="text-sm text-neutral-400">{page.description}</p>

                        <div class="xl:flex text-sm w-full mt-2">
                            <div class="flex mb-1 xl:mb-0 w-full">
                                <p class="text-neutral-300 border px-2 rounded-md w-1/2">up/down: 
                                    <span class="text-green-400">{page.monitors_up}</span>
                                    /
                                    <span class="text-red-400">{page.monitor_count - page.monitors_up}</span>
                                </p>

                                <p class="text-neutral-300 ml-2 border px-2 rounded-md w-1/2">avg. ping: 
                                    <span class="text-neutral-300">{page.avg_ping ? page.avg_ping + "ms" : "N/A"}</span>
                                </p>
                            </div>

                            <div class="flex w-full">
                                <p class="text-neutral-300 xl:ml-2 border px-2 rounded-md w-1/2">avg. uptime: 
                                    <span class="text-neutral-300">{page.avg_uptime ? page.avg_uptime + "%" : "N/A"}</span>
                                </p>

                                {#if page.status === "up"}
                                    <p class="text-green-400 ml-2 border px-2 rounded-md w-1/2">online :D</p>
                                {:else if page.status === "down"}
                                    <p class="text-red-400 ml-2 border px-2 rounded-md w-1/2">offline :c</p>
                                {:else if page.status === "degraded"}
                                    <p class="text-yellow-200 ml-2 border px-2 rounded-md w-1/2">
                                        degraded :/
                                    </p>
                                {:else}
                                    <p class="text-neutral-400 ml-2 border px-2 rounded-md w-1/2">status unknown</p>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>