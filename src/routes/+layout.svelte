<script lang="ts">
    import { onMount } from "svelte";
	import "../app.css";
	import { getCookie } from "typescript-cookie";
    import { goto } from "$app/navigation";
    import state from "$lib/state.svelte";

	let { children } = $props();

	onMount(async () => {
		let token = getCookie("token");

		if (!token && window.location.pathname.startsWith("/dashboard")) {
			goto("/login");
		} else if (token) {
			let response = await fetch("/api/auth/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				goto("/login")
			} else {
				let data = await response.json();
				
				state.user = {
					username: data.username
				}
			}
		}

		state.loading = false;
	})
</script>

{@render children()}
