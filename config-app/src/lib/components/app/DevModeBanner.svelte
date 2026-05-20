<script>
    import { FlaskConical, X } from '@lucide/svelte';
    import { devMode }         from '$lib/store/devMode.svelte.js';
    import { configState }     from '$lib/store/config.svelte.js';
</script>

{#if devMode.active}
    <div class="flex items-center gap-2 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-400 text-sm">
        <FlaskConical class="size-4 shrink-0" />
        <span class="font-medium">Mode démo actif</span>
        <span class="text-amber-400/70">— données simulées, aucun clavier requis.</span>
        <button
            class="ml-auto hover:text-amber-200 transition-colors"
            onclick={() => {
                devMode.active    = false;
                configState.data  = null;
            }}
            aria-label="Quitter le mode démo"
        >
            <X class="size-4" />
        </button>
    </div>
{/if}
