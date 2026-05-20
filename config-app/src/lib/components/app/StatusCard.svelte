<script lang="ts">
  import { serial } from "$lib/serial/index.svelte.js";
  import { devMode } from "$lib/store/devMode.svelte.js";
</script>

<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
  <div
    class="size-2 rounded-full transition-colors"
    class:bg-emerald-500={serial.connected || devMode.active}
    class:bg-muted={!serial.connected && !devMode.active}
  ></div>
  {#if devMode.active}
    <span class="text-amber-400">Démo</span>
  {:else}
    <span>{serial.connected ? "Connecté" : "Non connecté"}</span>
  {/if}
</div>
