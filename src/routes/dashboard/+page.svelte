<script lang="ts">
    import { goto } from "$app/navigation";
    import state from "$lib/state.svelte";
    import { onMount } from "svelte";
    import { getCookie } from "typescript-cookie";

    let monitors: any[] = [];

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
    });

    let view: string = "dashboard";
</script>

<div class="flex w-full h-screen flex-col p-2">
    <div class="flex mx-auto mt-2">
        <button 
            class={`${view === "dashboard" ? "underline" : ""} text-neutral-300`}
            on:click={() => { view = "dashboard" }}
        >dashboard</button>
        <p class="mx-2 text-neutral-500">\</p>
        <button
            class={`${view === "statusPages" ? "underline" : ""} text-neutral-300`}
            on:click={() => { view = "statusPages" }}
        >status pages</button>
    </div>

    <div class="flex w-full h-full gap-4 p-4">
        <div class="w-full md:w-1/3 h-full border border-neutral-800 rounded-md p-4 flex flex-col">
            <div class="flex">
                <h1 class="text-2xl font-bold text-neutral-300">Monitors</h1>
                <a href="/dashboard/monitors/new" class="ml-auto underline text-sm text-neutral-300 my-auto">new monitor →</a>
            </div>
        </div>
    </div>
</div>