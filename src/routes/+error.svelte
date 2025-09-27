<script>
    import { page } from "$app/state";

</script>
<div class="flex w-full h-screen">
    <div class="m-auto text-center">
        <h1 class="text-4xl font-bold text-red-400">{page.status}: {page.error?.message}</h1>
        <a href="/" class="text-neutral-300 underline mt-2">return to homepage →</a>
    </div>
</div>