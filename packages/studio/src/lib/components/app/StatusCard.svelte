<script lang="ts">
  import { serial } from "$lib/serial/index.svelte.js";
  import { devMode } from "$lib/store/devMode.svelte.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";

  import { Badge } from "$lib/components/ui/badge/index.js";
  import { configState, loadConfig } from "$lib/store/config.svelte";
  import { Button } from "../ui/button";
  import { FlaskConical } from "@lucide/svelte";

  async function handleDevMode() {
    devMode.active = !devMode.active;
    await loadConfig();
    configState.loadError = null;
  }
</script>

<!-- Dev mode toggle (visible si non connecté et non actif) -->
{#if !serial.connected}
  <Button
    variant="ghost"
    size="icon"
    onclick={handleDevMode}
    class="text-muted-foreground hover:text-blue-400 gap-1.5"
  >
    <FlaskConical class="{devMode.active ? 'text-blue-400' : ''} size-4" />
  </Button>
{/if}

<Badge variant="secondary">
  {#if configState.isLoading}
    <Spinner />
    Connecting
  {:else}
    <div
      class="size-1.5 mr-0.5 rounded-full transition-colors"
      class:bg-emerald-500={serial.connected && !configState.loadError}
      class:bg-amber-400={!serial.connected && !devMode.active}
      class:bg-destructive={configState.loadError && !devMode.active}
      class:bg-blue-400={devMode.active}
    ></div>

    {#if devMode.active}
      Démo
    {:else if configState.loadError}
      Erreur
    {:else}
      {serial.connected ? "Connecté" : "Non connecté"}
    {/if}
  {/if}
</Badge>
<div class="flex items-center gap-1.5 text-xs text-muted-foreground"></div>

<div class="flex flex-col items-center gap-2">
  <div class="flex w-full flex-wrap gap-2"></div>
</div>
