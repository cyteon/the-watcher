<script lang="ts">
    import { goto } from "$app/navigation";
    import { getCookie } from "typescript-cookie";

    let name: string = "";
    let slug: string = "";
    let description: string = "";

    let error: string | null = null;

    async function createPage() {
        error = null; 

        if (!name || !slug) {
            error = "Please fill in all fields :p";
            return;
        }

        try {
            const res = await fetch("/api/status_pages", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getCookie("token")}`,
                },
                body: JSON.stringify({
                    name,
                    slug,
                    description,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                error = errorData.error;
                return;
            }

            goto(`/status/${slug}`);
        } catch (err) {
            console.error("Error creating status page:", err);
            error = "An unexpected error occurred :(";
        }
    }
</script>

<div class="flex w-full h-screen flex-col p-2">
    <div class="flex flex-col p-4 border border-neutral-800 rounded-md m-auto w-full md:w-1/3">
        <h1 class="text-2xl font-bold text-neutral-300">New status page</h1>

        <label class="mt-4 text-neutral-300" for="name">Page Name</label>
        <input id="name" type="text" bind:value={name} />

        <label class="mt-2 text-neutral-300" for="url">URL Slug</label>
        <div class="flex border rounded-md">
            <div class="whitespace-pre bg-neutral-800 px-2 items-center flex text-lg text-neutral-300">
                <p>/status/</p>
            </div>
            <input class="bg-neutral-900! border-0! placeholder-neutral-400" id="url" type="text" placeholder="enter slug..." bind:value={slug} />
        </div>

        <label class="mt-2 text-neutral-300" for="interval">
            Description (optional)
        </label>
        <textarea
            id="interval"
            bind:value={description}
            class="h-24"
        ></textarea>

        {#if error}
            <p class="text-red-400 mt-4">{error}</p>
        {/if}

        <button
            class="mt-4 border text-neutral-300 rounded-md p-2 hover:bg-neutral-800 transition-colors duration-300"
            on:click={createPage}
        >
            Create Page
        </button>
    </div>
</div>