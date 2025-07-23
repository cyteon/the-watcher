<script lang="ts">
    import { goto } from "$app/navigation";
    import state from "$lib/state.svelte";
    import { onMount } from "svelte";
    import { setCookie } from "typescript-cookie";

    let username: string = "";
    let password: string = "";
    let confirmPassword: string = "";

    let error: string | null = "";

    async function register() {
        if (!username || !password || !confirmPassword) {
            error = "Please fill in all fields :p";
            return;
        }

        if (password !== confirmPassword) {
            error = "Passwords do not match :c";
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, confirmPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                error = data.error;
                return;
            }

            const data = await res.json();

            state.user = {
                username: data.username,
            };

            setCookie("token", data.token);
            goto("/dashboard");
        } catch (err) {
            console.error("Registration error:", err);
            error = "An unexpected error occurred :c";
        }
    }

    onMount(async () => {
        // check if a user exists, if not, create one
        const exists = await fetch("/api/auth/exists", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (exists.status === 200) {
            goto("/login");
        } else if (exists.status !== 200) {
            console.error("Failed to check if account exists:", exists.statusText);
            return;
        }
    });
</script>

<div class="flex w-full h-screen p-2">
    <div class="m-auto w-full md:w-1/4 p-4 border border-neutral-800 rounded-md flex flex-col">
        <h1 class="text-2xl font-bold text-neutral-300">Create a admin account</h1>
        <p class="text-sm text-neutral-300 mb-4">No account found, lets make one :)</p>

        <label class="text-neutral-300" for="username">Username</label>
        <input
            id="username"
            type="text"
            bind:value={username}
            placeholder="Username"
        />

        <label class="text-neutral-300 mt-2" for="password">Password</label>
        <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="Password"
        />

        <label class="text-neutral-300 mt-2" for="confirmPassword">Confirm Password</label>
        <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            placeholder="Confirm Password"
        />

        {#if error}
            <p class="text-red-400 mt-4">{error}</p>
        {/if}

        <button
            class="mt-4 border border-neutral-700 text-neutral-300 rounded-md p-2 hover:bg-neutral-800 transition-colors duration-300"
            on:click={register}
        >
            Register
        </button>
    </div>
</div>