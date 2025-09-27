<script lang="ts">
    import { onMount } from "svelte";

    let statusPages = [];

    onMount(async () => {
        try {
            const res = await fetch("/api/status_pages");
            if (!res.ok) {
                throw new Error("Failed to fetch status pages");
            }
            statusPages = await res.json();
        } catch (error) {
            console.error("Error fetching status pages:", error);
        }
    })
</script>

<div class="w-full h-screen flex flex-col">
    <a href="/dashboard" class="absolute right-2 mr-4 mt-2 underline text-sm text-neutral-300">go to dashboard →</a>

    <div class="m-auto w-full md:w-1/2 flex">
        {#if statusPages.length > 0}
            {#each statusPages as page}
                <div class="flex flex-col flex-1 p-2 border rounded-md m-2">
                    <div class="flex">
                        <h2 class="text-lg font-semibold text-neutral-300">{page.name}</h2>
                        
                        <a href={`/status/${page.slug}`} class="ml-auto my-auto text-sm text-neutral-300 hover:underline">
                            open page →
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
                                <span class="text-neutral-300">{page.avg_ping ? page.avg_ping.toString() + "ms" : "N/A"}</span>
                            </p>
                        </div>

                        <div class="flex w-full">
                            <p class="text-neutral-300 xl:ml-2 border px-2 rounded-md w-1/2">avg. uptime: 
                                <span class="text-neutral-300">{page.avg_uptime ? page.avg_uptime.toFixed(2) + "%" : "N/A"}</span>
                            </p>

                            {#if page.status === "up"}
                                <p class="text-green-400 ml-2 border px-2 rounded-md w-1/2">online :D</p>
                            {:else if page.status === "down"}
                                <p class="text-red-400 ml-2 border px-2 rounded-md w-1/2">offline :c</p>
                            {:else if page.status === "degraded"}
                                <p class="text-yellow-400 ml-2 border px-2 rounded-md w-1/2">
                                    degraded :/
                                </p>
                            {:else}
                                <p class="text-neutral-400 ml-2 border px-2 rounded-md w-1/2">unknown status</p>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {:else}
            <p class="text-neutral-300 mx-auto">no status pages found :(</p>
        {/if}
    </div>
</div>