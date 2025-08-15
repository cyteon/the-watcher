<script lang="ts">
    import { goto } from "$app/navigation";
    import state from "$lib/state.svelte";
    import { onMount } from "svelte";
    import { setCookie } from "typescript-cookie";

    let username: string = "";
    let password: string = "";
    let error: string | null = "";

    async function login() {
        error = null;

        if (!username || !password) {
            error = "Please fill in all fields :p";
            return;
        }

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                error = data.error || "An error occurred while logging in D:";
                return;
            }

            const data = await res.json();

            state.user = {
                username: data.username,
            };

            setCookie("token", data.token);
            goto("/dashboard");
        } catch (err) {
            console.error("Login error:", err);
            error = "An unexpected error occurred :c";
        }
    }

    onMount(async () => {
        // check if a user exists, if not, redirect to create
        const exists = await fetch("/api/auth/exists", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (exists.status === 204) {
            goto("/register");
        } else if (exists.status !== 200) {
            console.error("Failed to check if account exists:", exists.statusText);
            return;
        }
    });
</script>

<div class="flex w-full h-screen p-2">
    <div class="m-auto w-full md:w-1/4 p-4 border border-neutral-800 rounded-md flex flex-col">
        <h1 class="text-2xl font-bold text-neutral-300">Login</h1>
        <p class="text-sm text-neutral-300 mb-4">Please enter your credentials to continue :D</p>

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

        {#if error}
            <p class="text-red-400 mt-4">{error}</p>
        {/if}

        <button
            class="mt-4 border text-neutral-300 rounded-md p-2 hover:bg-neutral-800"
            on:click={login}
        >
            Login
        </button>
    </div>
</div>