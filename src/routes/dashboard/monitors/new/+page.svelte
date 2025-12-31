<script lang="ts">
    import { goto } from "$app/navigation";
    import { getCookie } from "typescript-cookie";

    let name: string = "";
    let url: string = "";

    let type: string = "http(s)";
    let url_label: string = "URL";
    $: switch (type) {
        case "http(s)":
            url_label = "URL";
            break;
        case "ping":
            url_label = "Host";
            break;
    }

    let heartbeat_interval: number = 60;
    let retries: number = 0;

    let error: string | null = null;

    async function createMonitor() {
        error = null; 

        if (!name || !url) {
            error = "Please fill in all fields :p";
            return;
        }

        try {
            const res = await fetch("/api/admin/monitors", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getCookie("token")}`,
                },
                body: JSON.stringify({
                    name,
                    type,
                    url,
                    heartbeat_interval,
                    retries,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                error = errorData.error;
                return;
            }

            goto("/dashboard");
        } catch (err) {
            console.error("Error creating monitor:", err);
            error = "An unexpected error occurred :(";
        }
    }
</script>

<div class="flex w-full h-screen flex-col p-2">
    <div class="flex flex-col p-4 border border-neutral-800 rounded-md m-auto w-full md:w-1/3">
        <h1 class="text-2xl font-bold text-neutral-300">Add new monitor</h1>

        <label class="mt-4 text-neutral-300" for="name">Monitor Name</label>
        <input id="name" type="text" bind:value={name} />

        <label class="mt-2 text-neutral-300" for="type">Monitor Type</label>
        <select id="type" bind:value={type} class="bg-neutral-900 border border-neutral-800 rounded-md p-2">
            <option value="http(s)">HTTP(S)</option>
            <option value="ping">Ping</option>
        </select>

        <label class="mt-2 text-neutral-300" for="url">{url_label}</label>
        <input id="url" type="text" bind:value={url} placeholder={
            type === "http(s)" ? "https://" : (
                type === "ping" ? "1.1.1.1" : ""
            )
        } />

        <label class="mt-2 text-neutral-300" for="interval">
            Heartbeat Interval (check every {heartbeat_interval} seconds)
        </label>
        <input
            id="interval"
            type="number"
            bind:value={heartbeat_interval}
            min="1"
            max="3600"
        />

        <label class="mt-2 text-neutral-300" for="type">Retries</label>
        <input id="retries" type="number" bind:value={retries} min="1" max="10" />

        {#if error}
            <p class="text-red-400 mt-4">{error}</p>
        {/if}

        <button
            class="mt-4 border text-neutral-300 rounded-md p-2 hover:bg-neutral-800 transition-colors duration-300"
            on:click={createMonitor}
        >
            Create Monitor
        </button>
    </div>
</div>