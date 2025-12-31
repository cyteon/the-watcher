<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { getCookie } from "typescript-cookie";

    export let data: { slug: string };

    let statusPage = {
        name: "",
        slug: data.slug,
        description: "",
        monitors: [],
    };

    let monitors: any[] = [];

    let error: string | null = null;

    onMount(async () => {
        try {
            const res = await fetch(`/api/status_pages/${data.slug}`);

            if (!res.ok) {
                goto("/dashboard");
                return;
            }

            statusPage = await res.json();
            statusPage.monitors = statusPage.monitors.map((m: any) => m.id);

            const res2 = await fetch(`/api/admin/monitors`, {
                headers: {
                    Authorization: `Bearer ${getCookie("token")}`,
                },
            });

            if (res2.ok) {
                monitors = await res2.json();
            }
        } catch (error) {
            console.error("Error fetching status page:", error);
        }
    });

    async function saveChanges() {
        error = null;

        if (!statusPage.name || !statusPage.slug) {
            error = "Please fill in mandatory fields :p";
            return;
        }

        try {
            const res = await fetch(`/api/status_pages/${data.slug}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getCookie("token")}`,
                },
                body: JSON.stringify({
                    name: statusPage.name,
                    slug: statusPage.slug,
                    description: statusPage.description,
                    monitors: statusPage.monitors,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                error = errorData.error;
                return;
            }

            goto(`/status/${statusPage.slug}`);
        } catch (err) {
            console.error("Error updating status page:", err);
            error = "An unexpected error occurred :(";
        }
    }

    function toggleMonitor(monitorId: string) {
        if (statusPage.monitors.includes(monitorId)) {
            statusPage.monitors = statusPage.monitors.filter(id => id !== monitorId);
        } else {
            statusPage.monitors = [...statusPage.monitors, monitorId];
        }
    }
</script>

<div class="flex w-full h-screen flex-col p-2">
    <div class="flex flex-col p-4 border border-neutral-800 rounded-md m-auto w-full md:w-1/3">
        <h1 class="text-2xl font-bold text-neutral-300">Update status page</h1>

        <label class="mt-4 text-neutral-300" for="name">Page Name</label>
        <input id="name" type="text" bind:value={statusPage.name} />

        <label class="mt-2 text-neutral-300" for="url">URL Slug</label>
        <div class="flex border rounded-md">
            <div class="whitespace-pre bg-neutral-800 px-2 items-center flex text-lg text-neutral-300">
                <p>/status/</p>
            </div>
            <input class="bg-neutral-900! border-0! placeholder-neutral-400" id="url" type="text" placeholder="enter slug..." bind:value={statusPage.slug} />
        </div>

        <label class="mt-2 text-neutral-300" for="interval">
            Description (optional)
        </label>
        <textarea
            id="interval"
            bind:value={statusPage.description}
            class="h-24"
        ></textarea>

        <label class="mt-2 text-neutral-300" for="monitors">
            Monitors
        </label>
        <div class="border border-neutral-700 rounded-md bg-neutral-900 max-h-48 overflow-y-auto">
            {#each monitors as monitor}
                <label class="flex items-center p-2 hover:bg-neutral-800 cursor-pointer">
                    <input
                        type="checkbox"
                        class="w-fit! mr-2"
                        checked={statusPage.monitors.find(id => id === monitor.id) !== undefined}
                        on:change={() => toggleMonitor(monitor.id)}
                    />

                    <span class="text-neutral-300">{monitor.name} ({monitor.url})</span>

                    {#if monitor.heartbeats[monitor.heartbeats.length - 1]}
                        {#if monitor.heartbeats[monitor.heartbeats.length - 1].status === "up"}
                            <span class="ml-auto text-green-400">up</span>
                        {:else if monitor.heartbeats[monitor.heartbeats.length - 1].status === "down"}
                            <span class="ml-auto text-red-400">down</span>
                        {:else}
                            <span class="ml-auto text-yellow-400">unknown</span>
                        {/if}
                    {:else}
                        <span class="ml-auto text-neutral-500">no data</span>
                    {/if}
                </label>
            {/each}

            {#if monitors.length === 0}
                <div class="p-2 text-neutral-500">No monitors available</div>
            {/if}
        </div>
        
        {#if error}
            <p class="text-red-400 mt-4">{error}</p>
        {/if}

        <div class="flex w-full space-x-2 mt-4 ">
            <a
                class="w-full text-center border text-neutral-300 rounded-md p-2 hover:bg-neutral-800 transition-colors duration-300"
                href="/dashboard"
            >
                Cancel
            </a>

            <button
                class="w-full border text-neutral-300 rounded-md p-2 hover:bg-neutral-800 transition-colors duration-300"
                on:click={saveChanges}
            >
                Save Changes
            </button>
        </div>
    </div>
</div>