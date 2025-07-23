<script lang="ts">
    import { goto } from "$app/navigation";
    import state from "$lib/state.svelte";
    import { onMount } from "svelte";

    onMount(async () => {
        if (!state.user && !state.loading) {
            goto("/login");
        }
    })
</script>